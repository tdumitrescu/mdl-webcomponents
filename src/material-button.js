import {defineComponent} from './register';
import CSS_BUTTON from './cssjs/button.css';
import CSS_RIPPLE from './cssjs/ripple.css';

export default function() {
  defineComponent('material-button', {
    mdlEl: 'button',
    createShadowDOM: function() {
      var className = "mdl-button mdl-js-button mdl-button--accent";
      if (this.hasAttribute('raised')) {
        className += " mdl-button--raised";
      }
      if (!this.hasAttribute('noink')) {
        className += " mdl-js-ripple-effect";
      }
      this.createShadowRoot().innerHTML =
        '<style>' + CSS_BUTTON + CSS_RIPPLE + '</style>' +
        '<button class="' + className + '"><content></content></button>';
    }
  });
};