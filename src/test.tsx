function assert(check: () => any) {
  if (!check()) {
    throw new Error("AssertionError: " + check.toString());
  }
}

window.onload = () => {
  const root = document.getElementById("root");

  render(<div style="color: red">Hello world from rendertree</div>, root);

  const childElement = root.childNodes[0];

  render(
    <div style="color: red">Hello world from rendertree again!</div>,
    root,
  );

  const secondChildElement = root.childNodes[0];

  assert(() => root.innerText === "Hello world from rendertree again!");
  assert(() => secondChildElement == childElement);

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
      <div>Three</div>
    </div>,
    root,
  );

  const elementTwo = root.childNodes[0].childNodes[1];

  assert(() => root.innerText === "One\nTwo\nThree");

  render(
    <div style="color: red">
      <div>One</div>
      <div>Two</div>
    </div>,
    root,
  );

  assert(() => root.childNodes[0].childNodes[1] == elementTwo);

  render(
    <div style="color: red">
      <div>One</div>
      <section>Two</section>
    </div>,
    root,
  );
};
