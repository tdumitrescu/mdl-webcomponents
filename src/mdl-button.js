import { h } from 'panel';

import { MDLComponent } from './component';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_RIPPLE from './cssjs/ripple.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export class MDLButton extends MDLComponent {
  get MDL_SELECTORS() {
    return ['button'];
  }

  get config() {
    return {

      css: [
        CSS_BUTTON,
        CSS_MATERIAL_ICONS,
        CSS_RIPPLE,
        CSS_TYPOGRAPHY,
      ].join(''),

      template: () => h('button', {
        className: this.calcClassName(),
        disabled: this.isAttributeEnabled('disabled'),
      }, [
        this.iconNode(),
        h('content'),
      ]),

      useShadowDom: true,
    };
  }

  classList() {
    return [
      'mdl-button',
      'mdl-js-button',
      `mdl-button--${this.buttonClassType()}`,
      this.isAttributeEnabled('raised') ? 'mdl-button--raised' : false,
      this.isAttributeEnabled('colored') ? 'mdl-button--colored' : false,
      this.rippleClass(),
    ];
  }

  buttonClassType() {
    if (this.isAttributeEnabled('fab')) {
      return 'fab';
    } else if (!!this.getAttribute('icon')) {
      return 'icon';
    } else {
      return 'accent';
    }
  }
}

export default function() {
  document.registerElement('mdl-button', MDLButton);
}
