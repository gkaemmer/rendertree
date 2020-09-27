function renderToNode(element: RenderElement): Node {
  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      throw new Error("Unimplemented: non-string types");
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
  if (!props) {
    props = defaultProps;
  }
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
  // precondition: can rerender
  if (isElementObject(element)) {
    syncAttributes(mountPoint as HTMLElement, element.props);
    let childIndex = mountPoint.childNodes.length;
    for (let i = 0; i < mountPoint.childNodes.length; i++) {
      const childNode = mountPoint.childNodes[i];
      if (i >= element.children.length) {
        console.log("removing", childNode);
        childNode.remove(); // Element no longer exists
        continue;
      }
      if (canRerender(element.children[i], childNode)) {
        rerender(element.children[i], childNode);
      } else {
        console.log("Replacing", childNode, "with", element.children[i]);
        childNode.replaceWith(renderToNode(element.children[i]));
      }
    }
    for (let i = childIndex; i < element.children.length; i++) {
      // Build new nodes for each unrendered child
      console.log("Adding new child for", element.children[i]);
      mountPoint.appendChild(renderToNode(element.children[i]));
    }
  } else {
    if (mountPoint.textContent === element) {
      console.log("Skipping render");
    } else {
      console.log(
        "Changing text from '" + mountPoint.textContent + "' to '" + element +
          "'",
      );
      mountPoint.textContent = element;
    }
  }
}

function canRerender(element: RenderElement, mountPoint: Node): boolean {
  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      return false;
    } else {
      return mountPoint.nodeType === Node.ELEMENT_NODE &&
        element.type.toUpperCase() == mountPoint.nodeName;
    }
  } else {
    return mountPoint.nodeType === Node.TEXT_NODE;
  }
}

function addChild(element: RenderElement, mountPoint: HTMLElement): void {
  // Appends _element_ to the current content of _mountPoint_

  if (isElementObject(element)) {
    if (isComponentFunction(element.type)) {
      // TODO:
      throw new Error("Unimplemented: non-string components");
    } else {
      const htmlElement = document.createElement(element.type);
      for (let key in element.props) {
        htmlElement.setAttribute(key, element.props[key]);
      }
      if (element.children.length > 0) {
        for (let child of element.children) {
          addChild(child, htmlElement);
        }
      }
      mountPoint.appendChild(htmlElement);
    }
  } else {
    // TODO: [hydrate] is hydration possible here?
    mountPoint.innerText += element;
  }
}

function render(element: RenderElement, mountPoint: HTMLElement): void {
  // Get HTML content from element and set mountPoint.innerHTML
  if (
    mountPoint.childNodes[0] && canRerender(element, mountPoint.childNodes[0])
  ) {
    rerender(element, mountPoint.childNodes[0]);
  } else {
    mountPoint.innerHTML = "";
    mountPoint.appendChild(renderToNode(element));
  }
}

function h<T>(
  type: Component<T>,
  props: T,
  ...children: RenderElement[]
): RenderElement {
  return {
    type,
    props,
    children,
  };
}

window.h = h;
