import { h } from 'panel';

import { MDLComponent } from './component';
import CSS_RIPPLE from './cssjs/ripple.css';
import CSS_SWITCH from './cssjs/switch.css';

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

      template: () => h('label', {
        className: this.calcClassName(),
        htmlFor: 'mdl-switch1',
      }, [
        h('input.mdl-switch__input', {
          checked: this.isAttributeEnabled('checked'),
          disabled: this.isAttributeEnabled('disabled'),
          id: 'mdl-switch1',
          type: 'checkbox',
        }),
        h('span.mdl-switch__label', {}, h('content')),
      ]),

      useShadowDom: true,
    };
  }

  classList() {
    return [
      'mdl-switch',
      'mdl-js-switch',
      this.rippleClass(),
    ];
  }
}

export default function() {
  document.registerElement('mdl-switch', MDLSwitch);
}
