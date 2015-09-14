import {defineComponent} from './register';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_TEXTFIELD from './cssjs/textfield.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export default function() {
  defineComponent('material-input', {
    mdlEl: ['.mdl-textfield', '.mdl-button--icon'],
    createShadowDOM: function() {
      var error = this.getAttribute('error'),
          errorHTML = error ? `<span class="mdl-textfield__error">${error}</span>` : '',

          expandable = this.hasAttribute('expandable'),
          expandableClass = expandable ? ' mdl-textfield--expandable' : '',
          label = this.getAttribute('label') || 'Text...',
          labelClass = this.hasAttribute('floating-label') ? ' mdl-textfield--floating-label' : '',
          textfieldClasses = expandableClass + labelClass,

          icon = this.getAttribute('icon'),
          iconHTML = icon ? `<i class="material-icons">${icon}</i>` : '',

          maxrows = this.getAttribute('maxrows'),
          maxrowsHTML = maxrows ? ` maxrows="${maxrows}"` : '',
          pattern = this.getAttribute('pattern'),
          patternHTML = pattern ? ` pattern="${pattern}"` : '',
          rows = this.getAttribute('rows'),
          rowsHTML = rows ? ` rows="${rows}"` : '',
          inputType = rows <= 1 ? 'input' : 'textarea',
          inputAttrs = patternHTML + rowsHTML + maxrowsHTML,

          inputHTML =
            `<${inputType} class="mdl-textfield__input" type="text" id="mdl-input1"${inputAttrs}></${inputType}>
            <label class="mdl-textfield__label" for="mdl-input1">${label}</label>`;

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
    },
    proto: {
      value: {
        get: function() {
          return this.shadowRoot.querySelector('.mdl-textfield__input').value;
        }
      }
    }
  });
};
