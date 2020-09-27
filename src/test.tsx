import { render, h } from "./renderer";
import { observable } from "mobx";

function assert(check: () => any) {
  let result;
  try {
    result = check();
  } catch (e) {
    throw new Error(
      "AssertionError: Could not calculate assertion: " + check.toString()
    );
  }
  if (!result) {
    throw new Error("AssertionError: " + check.toString());
  }
}

function childNode(element: HTMLElement) {
  return element.childNodes[0] as HTMLElement;
}

function testBasic(root: HTMLElement) {
  render(<div style="color: red">Hello world from rendertree</div>, root);

  let beforeElement = root.childNodes[0];

  render(
    <div style="color: red">Hello world from rendertree again!</div>,
    root
  );

  assert(() => root.innerText === "Hello world from rendertree again!");
  assert(() => root.childNodes[0] == beforeElement);

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
      <div>Three</div>
    </div>,
    root
  );

  beforeElement = root.childNodes[0].childNodes[1];

  assert(() => root.innerText === "One\nTwo\nThree");

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
    </div>,
    root
  );

  assert(() => root.childNodes[0].childNodes[1] == beforeElement);

  render(
    <div style="color: red">
      <div>One</div>
      <section>Two</section>
    </div>,
    root
  );

  render(
    <div>
      <div>One</div>
      <section>Two</section>
    </div>,
    root
  );

  assert(() => !childNode(root).getAttribute("style"));

  // Replace HTML nodes with text node
  render(<div>One</div>, root);

  const MyComponent = ({ name }: any) => <div>Hello {name}</div>;

  render(<MyComponent name="world" />, root);
  beforeElement = root.childNodes[0];

  assert(() => childNode(root).innerText === "Hello world");

  render(<MyComponent name="world" />, root);

  assert(() => root.childNodes[0] == beforeElement);

  render(null, root);

  assert(() => root.innerText === "");

  testObservability(root);
}

function testObservability(root: HTMLElement) {
  const state = observable({ count: 0 });
  const ObservableComponent = () => <div>Count: {state.count}</div>;
  render(<ObservableComponent />, root);
  assert(() => childNode(root).innerText === "Count: 0");
  state.count++;
  assert(() => childNode(root).innerText === "Count: 1");

  render(null, root);

  render(<ObservableComponent />, root);
  render(<div>Not observable</div>, root);
  state.count++;
  assert(() => childNode(root).innerText === "Not observable");

  render(null, root);

  state.count = 0;
  const ObservableNullComponent = () =>
    state.count > 0 ? <div>Something</div> : null;
  render(<ObservableNullComponent />, root);
  assert(() => root.innerText === "");
  state.count = 1;
  assert(() => childNode(root).innerText === "Something");
  console.log("Setting state to 0");
  state.count = 0;
  assert(() => root.innerText === "");

  render(null, root);
  render(
    <div>
      <ObservableNullComponent />
      <ObservableNullComponent />
    </div>,
    root
  );
}

export function test() {
  const root = document.getElementById("root");
  if (!root) throw new Error("No root element in page, cannot perform tests.");

  for (let testFunc of [testBasic, testObservability]) {
    root.innerHTML = "";
    testFunc(root);
  }
}
