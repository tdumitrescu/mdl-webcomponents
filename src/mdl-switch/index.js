import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_RIPPLE from 'material-design-lite/src/ripple/_ripple.scss';
import CSS_SWITCH from 'material-design-lite/src/switch/_switch.scss';
import template from './index.jade';

export class MDLSwitch extends MDLComponent {
  get MDL_SELECTORS() {
    return [
      '.mdl-switch',
      '.mdl-switch__input',
      '.mdl-switch__label',
      '.mdl-switch__ripple-container',
    ];
  }

  get config() {
    return {

      css: [
        CSS_RIPPLE,
        CSS_SWITCH,
      ].join(''),

      template,

      useShadowDom: true,
    };
  }

  get checked() {
    return this.el.querySelector('.mdl-switch__input').checked;
  }
}

export default function() {
  document.registerElement('mdl-switch', MDLSwitch);
}
