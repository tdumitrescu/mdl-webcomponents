import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLTextfield extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-textfield', '.mdl-button--icon'];
  }

  get config() {
    return {
      css,
      template,
      useShadowDom: true,
      helpers: {
        inputAttributes: () => {
          const attributes = {};
          for (const attr of ['maxrows', 'pattern', 'rows']) {
            if (this.hasAttribute(attr)) {
              attributes[attr] = this.getAttribute(attr);
            }
          }
          return attributes;
        },
      },
    };
  }

  get value() {
    return this.el.querySelector('.mdl-textfield__input').value;
  }
}

export default function() {
  document.registerElement('mdl-textfield', MDLTextfield);
};
