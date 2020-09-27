type ComponentFunction<T> = ((props: T) => RenderElement);
type Component<T> = ComponentFunction<T> | string;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

function isComponentFunction<T>(
  component: Component<T>,
): component is ComponentFunction<T> {
  return typeof component !== "string";
}

interface RenderElementObject {
  type: Component<any>;
  props: any;
  children: RenderElement[];
}

type RenderElement = RenderElementObject | string;

function isElementObject(
  element: RenderElement,
): element is RenderElementObject {
  return typeof element !== "string";
}
