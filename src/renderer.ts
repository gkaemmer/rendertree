import {
  RenderElement,
  isElementObject,
  isComponentFunction,
  Component,
} from "./types";
import { debug } from "./debug";

function renderToNode(element: RenderElement): Node {
  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      const renderResult = element.type(element.props);
      return renderToNode(renderResult);
    } else {
      const node = document.createElement(element.type);
      rerender(element, node);
      return node;
    }
  } else {
    return document.createTextNode(element);
  }
}

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

function rerender(element: RenderElement, mountPoint: Node): void {
  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      // Element.type is a function, call it to get what should be rendered, and
      // then recurse

      const newElement = element.type(element.props);
      rerender(newElement, mountPoint);
    } else {
      // Element.type is a raw HTML type, sync mountPoint with that raw node
      // First, check if mountPoint can be re-used for this element
      if (
        mountPoint.nodeType !== Node.ELEMENT_NODE ||
        mountPoint.nodeName !== element.type.toUpperCase()
      ) {
        const newMountPoint = document.createElement(element.type);
        debug("Replacing", mountPoint, "with", newMountPoint);
        (mountPoint as Element).replaceWith(newMountPoint);
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
        const newNode = renderToNode(element.children[i]);
        debug("Adding new child: ", newNode);
        mountPoint.appendChild(newNode);
      }
    }
  } else {
    // First, make sure mountPoint is a text node. If it isn't replace it with
    // one
    if (mountPoint.nodeType !== Node.TEXT_NODE) {
      const newMountPoint = document.createTextNode(element);
      debug("Replacing", mountPoint, "with", element);
      (mountPoint as Element).replaceWith(newMountPoint);
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
}

export function render(element: RenderElement, mountPoint: HTMLElement): void {
  // Get HTML content from element and set mountPoint.innerHTML
  if (mountPoint.childNodes[0]) {
    rerender(element, mountPoint.childNodes[0]);
  } else {
    mountPoint.innerHTML = "";
    mountPoint.appendChild(renderToNode(element));
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
