import { render, h } from "./renderer";

function assert(check: () => any) {
  if (!check()) {
    throw new Error("AssertionError: " + check.toString());
  }
}

export function test() {
  const root = document.getElementById("root");
  if (!root) throw new Error("No root element in page, cannot perform tests.");

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

  assert(() => !(root.childNodes[0] as HTMLElement).getAttribute("style"));

  // Replace HTML nodes with text node
  render(<div>One</div>, root);

  const MyComponent = ({ name }: any) => <div>Hello {name}</div>;

  render(<MyComponent name="world" />, root);
  beforeElement = root.childNodes[0];

  assert(() => (root.childNodes[0] as HTMLElement).innerText === "Hello world");

  render(<MyComponent name="world" />, root);

  assert(() => root.childNodes[0] == beforeElement);

  render(null, root);

  assert(() => root.childNodes.length === 0);

  testObservability();
}

function testObservability() {
  const root = document.getElementById("");
  // render()
}
