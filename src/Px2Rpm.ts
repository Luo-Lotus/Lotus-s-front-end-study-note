const computedFontStyle = (): void => {
  const fontSize = document.documentElement.clientWidth / 750;
  document.documentElement.setAttribute("style", `font-size:${fontSize}px;`);
  console.log(document.documentElement.getAttribute("style"));
};
computedFontStyle();
window.onresize = () => {
  computedFontStyle();
};
