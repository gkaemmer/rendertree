function assert(check: () => any) {
  if (!check()) {
    throw new Error("AssertionError: " + check.toString());
  }
}

window.onload = () => {
  const root = document.getElementById("root");

  render(<div style="color: red">Hello world from rendertree</div>, root);

  let beforeElement = root.childNodes[0];

  render(
    <div style="color: red">Hello world from rendertree again!</div>,
    root,
  );

  const secondChildElement = root.childNodes[0];

  assert(() => root.innerText === "Hello world from rendertree again!");
  assert(() => root.childNodes[0] == beforeElement);

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
      <div>Three</div>
    </div>,
    root,
  );

  beforeElement = root.childNodes[0].childNodes[1];

  assert(() => root.innerText === "One\nTwo\nThree");

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
    </div>,
    root,
  );

  assert(() => root.childNodes[0].childNodes[1] == beforeElement);

  render(
    <div style="color: red">
      <div>One</div>
      <section>Two</section>
    </div>,
    root,
  );

  render(
    <div>
      <div>One</div>
      <section>Two</section>
    </div>,
    root,
  );

  assert(() => !(root.childNodes[0] as HTMLElement).getAttribute("style"));

  // Replace HTML nodes with text node
  render(
    <div>One</div>,
    root,
  );

  const MyComponent = ({ name }: any) => <div>Hello {name}</div>;

  render(<MyComponent name="world" />, root);
  beforeElement = root.childNodes[0];

  assert(() => (root.childNodes[0] as HTMLElement).innerText === "Hello world");

  render(<MyComponent name="world" />, root);

  assert(() => (root.childNodes[0]) == beforeElement);
};
