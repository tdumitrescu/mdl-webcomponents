import {defineComponent} from './register';
import CSS_TEXTFIELD from './cssjs/textfield.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export default function() {
  defineComponent('material-input', {
    mdlEl: '.mdl-textfield',
    createShadowDOM: function() {
      var error = this.getAttribute('error'),
          errorHTML = error ? '<span class="mdl-textfield__error">' + error + '</span>' : '',
          label = this.getAttribute('label') || 'Text...',
          labelClass = this.hasAttribute('floating-label') ? ' mdl-textfield--floating-label' : '',
          pattern = this.getAttribute('pattern'),
          patternHTML = pattern ? ' pattern="' + pattern + '"' : '',
          rows = this.getAttribute('rows'),
          rowsHTML = rows ? ' rows="' + rows + '"' : '',
          inputType = rows <= 1 ? 'input' : 'textarea',
          inputAttrs = patternHTML + rowsHTML;

      this.createShadowRoot().innerHTML =
        '<style>' + CSS_TEXTFIELD + CSS_TYPOGRAPHY + '</style>' +
        '<div class="mdl-textfield mdl-js-textfield' + labelClass + '">' +
          '<' + inputType + ' class="mdl-textfield__input" type="text" id="mdl-input1"'+ inputAttrs + '>' +
          '</' + inputType + '>' +
          '<label class="mdl-textfield__label" for="mdl-input1">' + label + '</label>' +
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
