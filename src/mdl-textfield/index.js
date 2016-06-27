import { MDLComponent } from '../component';
import CSS_BUTTON from 'material-design-lite/src/button/_button.scss';
import CSS_MATERIAL_ICONS from '../common/material-icons.scss';
import CSS_TEXTFIELD from 'material-design-lite/src/textfield/_textfield.scss';
import CSS_TYPOGRAPHY from 'material-design-lite/src/typography/_typography.scss';
import template from './index.jade';

export class MDLTextfield extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-textfield', '.mdl-button--icon'];
  }

  get config() {
    return {

      css: [
        CSS_BUTTON,
        CSS_MATERIAL_ICONS,
        CSS_TEXTFIELD,
        CSS_TYPOGRAPHY,
      ].join(''),

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
