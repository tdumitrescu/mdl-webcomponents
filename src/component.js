import { Component } from 'panel';

let componentCount = 1;
let contentInsertID = 1;

export class MDLComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(() =>
      this.MDL_SELECTORS.forEach(selector => this.upgradeEls(selector))
    );
  }

  /**
   * clone element into top level of component to create insertion
   * point for <content>
   * @param {HTMLElement} element to clone
   * @returns {string} selector of newly-cloned element
   */
  insertContent(el) {
    const contentClass = `mdl-wc-content-insert-${contentInsertID++}`;
    const contentEl = document.createElement('div');
    contentEl.className = contentClass;
    contentEl.appendChild(el.cloneNode(true));
    this.appendChild(contentEl);
    return `.${contentClass}`;
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
