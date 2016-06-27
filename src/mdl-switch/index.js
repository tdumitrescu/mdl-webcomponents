import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

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
      css,
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
