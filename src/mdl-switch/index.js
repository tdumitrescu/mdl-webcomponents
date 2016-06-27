import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_RIPPLE from 'material-design-lite/src/ripple/_ripple.scss';
import CSS_SWITCH from 'material-design-lite/src/switch/_switch.scss';

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

  get checked() {
    return this.el.querySelector('.mdl-switch__input').checked;
  }
}

export default function() {
  document.registerElement('mdl-switch', MDLSwitch);
}
