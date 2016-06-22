import { MDLComponent } from './register';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_RIPPLE from './cssjs/ripple.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export default function() {
  document.registerElement('mdl-button', class extends MDLComponent {
    get MDL_SELECTORS() {
      return ['button'];
    }

    createDOM() {
      var icon = this.getAttribute('icon'),
          iconHTML = icon ? `<i class="material-icons">${icon}</i>` : '',
          iconClass = icon ? 'icon' : 'accent',
          className = `mdl-button mdl-js-button mdl-button--${iconClass}`,
          buttonAttrs = this.hasAttribute('disabled') ? ' disabled' : '';
      if (this.hasAttribute('raised')) {
        className += " mdl-button--raised";
      }
      if (!this.hasAttribute('noink')) {
        className += " mdl-js-ripple-effect";
      }
      this.createShadowRoot().innerHTML =
        `<style>${CSS_BUTTON}${CSS_MATERIAL_ICONS}${CSS_RIPPLE}${CSS_TYPOGRAPHY}</style>` +
        `<button class="${className}"${buttonAttrs}>${iconHTML}<content></content></button>`;
    }
  });
}
