export function injectGlobalCSS(cssStr) {
  let headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  let styleEl = document.createElement('style');
  headEl.appendChild(styleEl);
  styleEl.setAttribute('type', 'text/css');
  styleEl.textContent = cssStr;
}
