import {
  RenderElement,
  isElementObject,
  isComponentFunction,
  Component,
} from "./types";
import { debug } from "./debug";
import { reaction, when, IReactionDisposer } from "mobx";

type DOMNode = Text | Element;

const defaultProps = {};

function syncAttributes(element: HTMLElement, props: any) {
  props = props || defaultProps;
  for (let attr of element.attributes) {
    if (typeof props[attr.name] === "undefined") {
      element.removeAttribute(attr.name);
    }
  }
  for (let key in props) {
    element.setAttribute(key, props[key]);
  }
}

const disposers = new WeakMap<Node, IReactionDisposer>();

function createNullNode(): DOMNode {
  // We use empty text nodes as NULL (simpler than deleting null nodes from the tree)
  return document.createTextNode("");
}

function isNullNode(node: DOMNode) {
  return node.nodeType === Node.TEXT_NODE && node.textContent === "";
}

// Rerender is the "meat" -- replaces the content of _mountPoint_ with the
// result of rendering _element_ to DOM. It is designed to be called again with
// the same arguments and cause no changes to existing DOM
// If called with a _mountPoint_ whose type does not match that of _element_'s
// root node, _mountPoint_ will be replaced with a new node (using replaceWith).
// If called with an EMPTY _mountPoint_, an adequate node will be created and
// returned.
function rerender(
  element: RenderElement | null,
  mountPoint: DOMNode | null,
  parent: DOMNode,
  clearObserver: boolean = true
): DOMNode {
  if (clearObserver && mountPoint && disposers.has(mountPoint)) {
    const disposer = disposers.get(mountPoint) as IReactionDisposer;
    disposer();
    disposers.delete(mountPoint);
  }
  if (element === null) {
    // When element is null, replace mountPoint with a null node
    if (!mountPoint) {
      mountPoint = createNullNode();
    } else if (!isNullNode(mountPoint)) {
      const newMountPoint = createNullNode();
      mountPoint.replaceWith(newMountPoint);
    }
  } else if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      // Element.type is a function, call it to get what should be rendered, and
      // then recurse
      // TODO: Listen for all observables that are accessed during this render
      // and automatically listen for changes. On a change, call rerender again.
      let newElement = null;
      const componentFunction = element.type;
      const disposer = reaction(
        () => {
          newElement = componentFunction(element.props);
          return newElement;
        },
        (newElement: RenderElement) => {
          console.log("Rerendering due to an observable change", newElement);
          // Set clearObserver to FALSE to avoid clearing the observer for this
          // mountpoint
          mountPoint = rerender(newElement, mountPoint, parent, false);
        }
      );
      mountPoint = rerender(newElement, mountPoint, parent);
      disposers.set(mountPoint, disposer);
    } else {
      // Element.type is a raw HTML type, sync mountPoint with that raw node
      // First, check if mountPoint can be re-used for this element
      const childElements = element.children;

      if (
        !mountPoint ||
        mountPoint.nodeType !== Node.ELEMENT_NODE ||
        mountPoint.nodeName !== element.type.toUpperCase()
      ) {
        const newMountPoint = document.createElement(element.type);
        if (mountPoint) {
          debug("Replacing", mountPoint, "with", newMountPoint);
          (mountPoint as Element).replaceWith(newMountPoint);
        } else {
          debug("Creating non-text node:", newMountPoint);
        }
        mountPoint = newMountPoint;
      }

      syncAttributes(mountPoint as HTMLElement, element.props);
      let childIndex = mountPoint.childNodes.length;
      let prevChild: DOMNode | null = null;
      for (let i = 0; i < mountPoint.childNodes.length; i++) {
        const childNode = mountPoint.childNodes[i] as DOMNode;
        if (i >= childElements.length) {
          debug("Removing", childNode);
          childNode.remove(); // Element no longer exists
        } else {
          rerender(childElements[i], childNode, mountPoint);
        }
        prevChild = childNode;
      }
      for (let i = childIndex; i < childElements.length; i++) {
        // Build new nodes for each unrendered child
        const newNode = rerender(childElements[i], null, mountPoint);
        mountPoint.appendChild(newNode);
        prevChild = newNode;
      }
    }
  } else {
    // Element is a string, so we should be building a text node.
    // First, make sure mountPoint is a text node. If it isn't replace it with
    // one
    const newContent = element.toString();
    if (!mountPoint || mountPoint.nodeType !== Node.TEXT_NODE) {
      const newMountPoint = document.createTextNode(newContent);
      if (mountPoint) {
        debug("Replacing", mountPoint, "with", element);
        (mountPoint as Element).replaceWith(newMountPoint);
      } else {
        debug("Creating text node:", newContent);
      }
      mountPoint = newMountPoint;
    }
    if (mountPoint.textContent !== newContent) {
      debug(
        "Changing text from '" +
          mountPoint.textContent +
          "' to '" +
          element +
          "'"
      );
      mountPoint.textContent = newContent;
    }
  }
  return mountPoint;
}

export function render(
  element: RenderElement | null,
  mountPoint: HTMLElement
): void {
  // Get HTML content from element and set mountPoint.innerHTML
  debug("Starting render", element);
  if (mountPoint.childNodes[0]) {
    rerender(element, mountPoint.childNodes[0] as DOMNode, mountPoint);
  } else {
    const node = rerender(element, null, mountPoint);
    if (node) mountPoint.appendChild(node);
  }
}

export function h<T>(
  type: Component<T>,
  props: T,
  ...children: RenderElement[]
): RenderElement {
  return { type, props, children };
}

(window as any).h = h;
