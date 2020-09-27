import {
  RenderElement,
  isElementObject,
  isComponentFunction,
  Component,
} from "./types";
import { debug } from "./debug";

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

// Rerender is the "meat" -- replaces the content of _mountPoint_ with the
// result of rendering _element_ to DOM. It is designed to be called again with
// the same arguments and cause no changes to existing DOM
function rerender(element: RenderElement, mountPoint: Node | null): Node {
  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      // Element.type is a function, call it to get what should be rendered, and
      // then recurse
      // TODO:
      const newElement = element.type(element.props);
      return rerender(newElement, mountPoint);
    } else {
      // Element.type is a raw HTML type, sync mountPoint with that raw node
      // First, check if mountPoint can be re-used for this element
      if (
        !mountPoint ||
        mountPoint.nodeType !== Node.ELEMENT_NODE ||
        mountPoint.nodeName !== element.type.toUpperCase()
      ) {
        const newMountPoint = document.createElement(element.type);
        if (mountPoint) {
          debug("Replacing", mountPoint, "with", newMountPoint);
          (mountPoint as Element).replaceWith(newMountPoint);
        }
        mountPoint = newMountPoint;
      }

      syncAttributes(mountPoint as HTMLElement, element.props);
      let childIndex = mountPoint.childNodes.length;
      for (let i = 0; i < mountPoint.childNodes.length; i++) {
        const childNode = mountPoint.childNodes[i];
        if (i >= element.children.length) {
          debug("removing", childNode);
          childNode.remove(); // Element no longer exists
          continue;
        }
        rerender(element.children[i], childNode);
      }
      for (let i = childIndex; i < element.children.length; i++) {
        // Build new nodes for each unrendered child
        const newNode = rerender(element.children[i], null);
        debug("Adding new child: ", newNode);
        mountPoint.appendChild(newNode);
      }
    }
  } else {
    // First, make sure mountPoint is a text node. If it isn't replace it with
    // one
    if (!mountPoint || mountPoint.nodeType !== Node.TEXT_NODE) {
      const newMountPoint = document.createTextNode(element);
      if (mountPoint) {
        debug("Replacing", mountPoint, "with", element);
        (mountPoint as Element).replaceWith(newMountPoint);
      }
      mountPoint = newMountPoint;
    }
    if (mountPoint.textContent === element) {
      debug("Skipping render");
    } else {
      debug(
        "Changing text from '" +
          mountPoint.textContent +
          "' to '" +
          element +
          "'"
      );
      mountPoint.textContent = element;
    }
  }
  return mountPoint;
}

export function render(element: RenderElement, mountPoint: HTMLElement): void {
  // Get HTML content from element and set mountPoint.innerHTML
  rerender(element, mountPoint.childNodes[0]);
}

export function h<T>(
  type: Component<T>,
  props: T,
  ...children: RenderElement[]
): RenderElement {
  return { type, props, children };
}

(window as any).h = h;
