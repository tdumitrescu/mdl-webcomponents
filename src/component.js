import { Component } from 'panel';

let componentCount = 1;

export class MDLComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(() =>
      this.MDL_SELECTORS.forEach(selector => this.upgradeEls(selector))
    );
  }

  rippleClass() {
    return !this.isAttributeEnabled('noink') ? 'mdl-js-ripple-effect' : false;
  }

  upgradeEls(selector) {
    const els = this.el.querySelectorAll(selector);
    for (let i = 0; i < els.length; i++) {
      window.componentHandler.upgradeElement(els[i]);
    }
  }

  // unique identifier
  get mdlID() {
    return this._mdlID = (this._mdlID || `mdl-wc-${componentCount++}`);
  }

  // selectors of elements to call upgradeElement() on for mdl
  get MDL_SELECTORS() {
    return [];
  }
}
