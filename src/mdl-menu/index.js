import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_BUTTON from 'material-design-lite/src/button/_button.scss';
import CSS_MATERIAL_ICONS from '../common/material-icons.scss';
import CSS_MENU from 'material-design-lite/src/menu/_menu.scss';
import CSS_RIPPLE from 'material-design-lite/src/ripple/_ripple.scss';
import CSS_TYPOGRAPHY from 'material-design-lite/src/typography/_typography.scss';
import template from './index.jade';

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

      template,

      useShadowDom: true,

      helpers: {
        buttonAttrs: () => {
          const attributes = {};
          if (this.hasAttribute('disabled')) {
            attributes.disabled = true;
          }
          const icon = this.getAttribute('label-icon');
          if (icon) {
            attributes.icon = icon;
          }
          return attributes;
        },

        clickItem: ev => {
          if (!ev.target.hasAttribute('disabled')) {
            this.dispatchEvent(new CustomEvent('select', {detail: ev.target}));
          }
        },

        itemAttrs: item => {
          const attributes = {};
          if (item.hasAttribute('disabled')) {
            attributes.disabled = true;
          }
          return attributes;
        },

        menuItems: () => {
          // HTMLCollection to Array
          const items = Array(this.children.length);
          for (let i = 0; i < this.children.length; i++) {
            items[i] = this.children[i];
          }
          return items;
        },

        position: () => this.getAttribute('position') || 'bottom-left',
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-menu', MDLMenu);
}
