import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_BUTTON from '../cssjs/button.css';
import CSS_MATERIAL_ICONS from '../cssjs/material-icons.css';
import CSS_RIPPLE from '../cssjs/ripple.css';
import CSS_TYPOGRAPHY from '../cssjs/typography.css';
import template from './index.jade';

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

      template,

      useShadowDom: true,

      helpers: {
        buttonModClass: () => {
          let suffix;
          if (this.isAttributeEnabled('fab')) {
            suffix = 'fab';
          } else if (!!this.getAttribute('icon')) {
            suffix = 'icon';
          } else {
            suffix = 'accent';
          }
          return `mdl-button--${suffix}`;
        }
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-button', MDLButton);
}
