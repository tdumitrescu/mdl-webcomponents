import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLMenu extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-menu', '.mdl-menu__item', '.mdl-button'];
  }

  get config() {
    return {
      css,
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
