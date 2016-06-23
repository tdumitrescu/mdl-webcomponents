export class MDLComponent extends HTMLElement {
  createdCallback() {
    this.createDOM();
    this.rootEl = this.shadowRoot || this;
    this.MDL_SELECTORS.forEach(selector => this.upgradeEls(selector));
  }

  createDOM() {
  }

  upgradeEls(selector) {
    const els = this.rootEl.querySelectorAll(selector);
    els.forEach(el => window.componentHandler.upgradeElement(el));
  }

  // selectors of elements to call upgradeElement() on for mdl
  get MDL_SELECTORS() {
    return [];
  }
}
