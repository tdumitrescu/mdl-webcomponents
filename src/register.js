export class MDLComponent extends HTMLElement {
  createdCallback() {
    this.createDOM();
    this.rootEl = this.shadowRoot || this;
    this.MDL_SELECTORS.forEach(selector => this.upgradeEl(selector));
  }

  createDOM() {
  }

  upgradeEl(selector) {
    const el = this.rootEl.querySelector(selector);
    if (el) {
      window.componentHandler.upgradeElement(el);
    }
  }

  // selectors of elements to call upgradeElement() on for mdl
  get MDL_SELECTORS() {
    return [];
  }
}
