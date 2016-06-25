import { h } from 'panel';

import { MDLComponent } from './component';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_TEXTFIELD from './cssjs/textfield.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export class MDLInput extends MDLComponent {
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
        disabled: this.isAttributeEnabled('disabled'),
      }, [
        this.inputNode(),
        this.errorNode(),
      ]),

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

  inputNode() {
    return '';
  }

  errorNode() {
    return '';
  }

  createDOM() {
    var error = this.getAttribute('error'),
        errorHTML = error ? `<span class="mdl-textfield__error">${error}</span>` : '',

        expandable = this.hasAttribute('expandable'),
        expandableClass = expandable ? ' mdl-textfield--expandable' : '',
        label = this.getAttribute('label') || 'Text...',
        labelClass = this.hasAttribute('floating-label') ? ' mdl-textfield--floating-label' : '',
        textfieldClasses = expandableClass + labelClass,

        icon = this.getAttribute('icon'),
        iconHTML = icon ? `<i class="material-icons">${icon}</i>` : '',

        disabledHTML = this.hasAttribute('disabled') ? ' disabled' : '',
        maxrows = this.getAttribute('maxrows'),
        maxrowsHTML = maxrows ? ` maxrows="${maxrows}"` : '',
        pattern = this.getAttribute('pattern'),
        patternHTML = pattern ? ` pattern="${pattern}"` : '',
        rows = this.getAttribute('rows'),
        rowsHTML = rows ? ` rows="${rows}"` : '',
        inputType = rows <= 1 ? 'input' : 'textarea',
        inputAttrs = patternHTML + rowsHTML + maxrowsHTML + disabledHTML,

        inputHTML =
          `<${inputType} class="mdl-textfield__input" type="text" id="mdl-input1"${inputAttrs}></${inputType}>` +
          `<label class="mdl-textfield__label" for="mdl-input1">${label}</label>`;

    if (expandable) {
      inputHTML =
        '<label class="mdl-button mdl-js-button mdl-button--icon" for="mdl-input1">' +
          iconHTML +
        '</label>' +
        '<div class="mdl-textfield__expandable-holder">' +
          inputHTML +
        '</div>'
    }

    this.createShadowRoot().innerHTML =
      `<style>${CSS_BUTTON}${CSS_MATERIAL_ICONS}${CSS_TEXTFIELD}${CSS_TYPOGRAPHY}</style>` +
      `<div class="mdl-textfield mdl-js-textfield${textfieldClasses}">` +
        inputHTML +
        errorHTML +
      '</div>';
  }

  get value() {
    return this.el.querySelector('.mdl-textfield__input').value;
  }
}

export default function() {
  document.registerElement('mdl-input', MDLInput);
};
