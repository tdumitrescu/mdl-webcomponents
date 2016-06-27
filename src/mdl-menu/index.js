import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_BUTTON from 'material-design-lite/src/button/_button.scss';
import CSS_MATERIAL_ICONS from '../common/material-icons.scss';
import CSS_MENU from 'material-design-lite/src/menu/_menu.scss';
import CSS_RIPPLE from 'material-design-lite/src/ripple/_ripple.scss';
import CSS_TYPOGRAPHY from 'material-design-lite/src/typography/_typography.scss';

export class MDLMenu extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-menu', '.mdl-menu__item', '.mdl-button'];
  }

  get config() {
    return {

      css: [
        CSS_BUTTON,
        CSS_MATERIAL_ICONS,
        CSS_MENU,
        CSS_RIPPLE,
        CSS_TYPOGRAPHY,
      ].join(''),

      template: () => h('.menu-container', {}, [
        h('button', {
          className: this.calcClassName(this.buttonClassList()),
          disabled: this.isAttributeEnabled('disabled'),
          id: 'menu-label',
        }, this.iconNode('label-icon') || this.getAttribute('label')),
        h('ul', {
          attributes: {for: 'menu-label'},
          className: this.calcClassName(this.menuClassList()),
        }, this.itemNodes()),
      ]),

      useShadowDom: true,
    };
  }

  buttonClassList() {
    return [
      'mdl-button',
      'mdl-js-button',
      `mdl-button--${!!this.getAttribute('label-icon') ? 'icon' : 'accent'}`,
      this.isAttributeEnabled('raised') ? 'mdl-button--raised' : false,
      this.rippleClass(),
    ];
  }

  menuClassList() {
    return [
      'mdl-menu',
      `mdl-menu--${this.getAttribute('position') || 'bottom-left'}`,
      'mdl-js-menu',
      this.rippleClass(),
    ];
  }

  itemNodes() {
    // introspect children to form mdl-menu__item li tags
    // because MDL hates shadow dom
    const items = [];
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      const attributes = {};
      if (child.hasAttribute('disabled')) {
        attributes.disabled = true;
      }
      items.push(h('li', {
        attributes,
        className: [
          'mdl-menu__item',
          child.hasAttribute('divider') ? 'mdl-menu__item--full-bleed-divider' : false,
        ].filter(Boolean).join(' '),
        onclick: ev => {
          if (!ev.target.hasAttribute('disabled')) {
            this.dispatchEvent(new CustomEvent('select', {detail: ev.target}));
          }
        },
      }, child.innerText));
    }
    return items;
  }
}

export default function() {
  document.registerElement('mdl-menu', MDLMenu);
}
