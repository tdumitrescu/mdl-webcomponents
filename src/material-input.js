import {defineComponent} from './register';
import CSS_TEXTFIELD from './cssjs/textfield.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export default function() {
  defineComponent('material-input', {
    mdlEl: '.mdl-textfield',
    createShadowDOM: function() {
      var label = this.getAttribute('label') || 'Text...',
          labelFloat = this.hasAttribute('floating-label') ? ' mdl-textfield--floating-label' : '',
          pattern = this.getAttribute('pattern'),
          error = this.getAttribute('error'),
          patternHTML = pattern ? ' pattern="' + pattern + '"' : '',
          errorHTML = error ? '<span class="mdl-textfield__error">' + error + '</span>' : '';

      this.createShadowRoot().innerHTML =
        '<style>' + CSS_TEXTFIELD + CSS_TYPOGRAPHY + '</style>' +
        '<div class="mdl-textfield mdl-js-textfield' + labelFloat + '">' +
          '<input class="mdl-textfield__input" type="text" id="mdl-input1"'+ patternHTML + '/>' +
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
