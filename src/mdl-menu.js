import { MDLComponent } from './component';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_MENU from './cssjs/menu.css';
import CSS_RIPPLE from './cssjs/ripple.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export default function() {
  defineComponent('mdl-menu', {
    mdlEl: ['.mdl-menu', '.mdl-menu__item', '.mdl-button'],
    createDOM: function() {
      var icon = this.getAttribute('label-icon'),
          label = this.getAttribute('label'),
          labelClass = icon ? 'icon' : 'accent',
          labelHTML = icon ? `<i class="material-icons">${icon}</i>` : label,
          rippleClass = this.hasAttribute('noink') ? '' : ' mdl-js-ripple-effect',
          buttonClassName = `mdl-button mdl-js-button mdl-button--${labelClass}${rippleClass}`,
          buttonAttrs = this.hasAttribute('disabled') ? ' disabled' : '',

          menuClass = `mdl-menu mdl-menu--bottom-left mdl-js-menu${rippleClass}`;

      this.createShadowRoot().innerHTML =
        `<style>${CSS_BUTTON}${CSS_MATERIAL_ICONS}${CSS_MENU}${CSS_RIPPLE}${CSS_TYPOGRAPHY}</style>` +
        '<div id="menu-container">' +
          `<button id="menu-label" class="${buttonClassName}"${buttonAttrs}>${labelHTML}</button>` +
          `<ul class="${menuClass}" for="menu-label">` +
            // `<li class="mdl-menu__item">hardcoded sample item</li>` +
            `<content></content>` +
          '</ul>' +
        '</div>';
    }
  });

  // defineComponent('mdl-menu-item', {
  //   mdlEl: '.mdl-menu__item',
  //   createDOM: function() {
  //     var icon = this.getAttribute('label-icon'),
  //         label = this.getAttribute('label'),
  //         labelClass = icon ? 'icon' : 'accent',
  //         labelHTML = icon ? `<i class="material-icons">${icon}</i>` : label,
  //         rippleClass = this.hasAttribute('noink') ? '' : ' mdl-js-ripple-effect',
  //         buttonClassName = `mdl-button mdl-js-button mdl-button--${labelClass}${rippleClass}`,
  //         buttonAttrs = this.hasAttribute('disabled') ? ' disabled' : '',

  //         menuClass = `mdl-menu mdl-menu--bottom-left mdl-js-menu${rippleClass}`;

  //     this.createShadowRoot().innerHTML =
  //       `<style>${CSS_BUTTON}${CSS_MATERIAL_ICONS}${CSS_MENU}${CSS_RIPPLE}${CSS_TYPOGRAPHY}</style>` +
  //       '<div id="menu-container">' +
  //         `<button id="menu-label" class="${buttonClassName}"${buttonAttrs}>${labelHTML}</button>` +
  //         `<ul class="${menuClass}" for="menu-label">` +
  //           // `<li class="mdl-menu__item">hardcoded sample item</li>` +
  //           `<content></content>` +
  //         '</ul>' +
  //       '</div>';
  //   }
  // });
};
