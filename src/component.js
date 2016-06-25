import { Component, h } from 'panel';

export class MDLComponent extends Component {
  attachedCallback() {
    super.attachedCallback(...arguments);
    window.requestAnimationFrame(() =>
      this.MDL_SELECTORS.forEach(selector => this.upgradeEls(selector))
    );
  }

  calcClassName(classList=this.classList()) {
    return classList.filter(Boolean).join(' ');
  }

  classList() {
    return [];
  }

  iconNode(iconAttr='icon') {
    const icon = this.getAttribute(iconAttr);
    return icon ? h('i.material-icons', icon) : '';
  }

  rippleClass() {
    return !this.isAttributeEnabled('noink') ? 'mdl-js-ripple-effect' : false;
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
