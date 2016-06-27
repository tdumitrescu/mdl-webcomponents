import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_BUTTON from 'material-design-lite/src/button/_button.scss';
import CSS_MATERIAL_ICONS from '../css/material-icons.scss';
import CSS_RIPPLE from 'material-design-lite/src/ripple/_ripple.scss';
import CSS_TYPOGRAPHY from 'material-design-lite/src/typography/_typography.scss';
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
