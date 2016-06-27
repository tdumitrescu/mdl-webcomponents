import { h } from 'panel';

import { MDLComponent } from '../component';
import CSS_BUTTON from 'material-design-lite/src/button/_button.scss';
import CSS_MATERIAL_ICONS from '../common/material-icons.scss';
import CSS_TEXTFIELD from 'material-design-lite/src/textfield/_textfield.scss';
import CSS_TYPOGRAPHY from 'material-design-lite/src/typography/_typography.scss';

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

      template: () => h('div', {
        className: this.calcClassName(),
      }, this.inputNodes()),

      useShadowDom: true,
    };
  }

  classList() {
    return [
      'mdl-textfield',
      'mdl-js-textfield',
      this.hasAttribute('expandable') ? 'mdl-textfield--expandable' : false,
      this.hasAttribute('floating-label') ? 'mdl-textfield--floating-label' : false,
    ];
  }

  inputNodes() {
    const attributes = {};
    for (const attr of ['maxrows', 'pattern', 'rows']) {
      if (this.hasAttribute(attr)) {
        attributes[attr] = this.getAttribute(attr);
      }
    }

    let nodes = [
      h(this.getAttribute('rows') <= 1 ? 'input' : 'textarea', {
        attributes,
        className: 'mdl-textfield__input',
        disabled: this.isAttributeEnabled('disabled'),
        id: 'mdl-input1',
        type: 'text',
      }),
      h('label.mdl-textfield__label', {
        htmlFor: 'mdl-input1',
      }, this.getAttribute('label') || 'Text...'),
    ];

    if (this.isAttributeEnabled('expandable')) {
      nodes = [
        h('label.mdl-button.mdl-js-button.mdl-button--icon', {
          htmlFor: 'mdl-input1',
        }, this.iconNode()),
        h('.mdl-textfield__expandable-holder', nodes),
      ];
    }

    nodes.push(this.errorNode());

    return nodes;
  }

  errorNode() {
    const err = this.getAttribute('error');
    return err ? h('span.mdl-textfield__error', err) : '';
  }

  get value() {
    return this.el.querySelector('.mdl-textfield__input').value;
  }
}

export default function() {
  document.registerElement('mdl-textfield', MDLTextfield);
};
