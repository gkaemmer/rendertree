type ComponentFunction<T> = (props: T) => RenderElement;
export type Component<T> = ComponentFunction<T> | string;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export function isComponentFunction<T>(
  component: Component<T>
): component is ComponentFunction<T> {
  return typeof component !== "string";
}

interface RenderElementObject {
  type: Component<any>;
  props: any;
  children: RenderElement[];
}

export type RenderElement = RenderElementObject | string;

export function isElementObject(
  element: RenderElement
): element is RenderElementObject {
  return typeof element !== "string";
}
