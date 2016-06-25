import { Component, h } from 'panel';

export class MDLComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(() =>
      this.MDL_SELECTORS.forEach(selector => this.upgradeEls(selector))
    );
  }

  calcClassName() {
    return this.classList().filter(Boolean).join(' ');
  }

  classList() {
    return [];
  }

  iconNode() {
    const icon = this.getAttribute('icon');
    return icon ? h('i.material-icons', icon) : '';
  }

  upgradeEls(selector) {
    const els = this.el.querySelectorAll(selector);
    els.forEach(el => window.componentHandler.upgradeElement(el));
  }

  // selectors of elements to call upgradeElement() on for mdl
  get MDL_SELECTORS() {
    return [];
  }
}
