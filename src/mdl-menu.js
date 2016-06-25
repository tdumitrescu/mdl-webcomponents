import { h } from 'panel';

import { MDLComponent } from './component';
import CSS_BUTTON from './cssjs/button.css';
import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import CSS_MENU from './cssjs/menu.css';
import CSS_RIPPLE from './cssjs/ripple.css';
import CSS_TYPOGRAPHY from './cssjs/typography.css';

export class MDLMenu extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-menu', '.mdl-menu__item', '.mdl-button'];
  }

  get config() {
    return {

      css: [
        CSS_BUTTON,
        CSS_MATERIAL_ICONS,
        CSS_MENU,
        CSS_RIPPLE,
        CSS_TYPOGRAPHY,
      ].join(''),

      template: () => h('.menu-container', {}, [
        h('button', {
          className: this.calcClassName(this.buttonClassList()),
          disabled: this.isAttributeEnabled('disabled'),
          id: 'menu-label',
        }, this.iconNode('label-icon') || this.getAttribute('label')),
        h('ul', {
          attributes: {for: 'menu-label'},
          className: this.calcClassName(this.menuClassList()),
        }, this.itemNodes()),
      ]),

      useShadowDom: true,
    };
  }

  buttonClassList() {
    return [
      'mdl-button',
      'mdl-js-button',
      `mdl-button--${!!this.getAttribute('label-icon') ? 'icon' : 'accent'}`,
      this.isAttributeEnabled('raised') ? 'mdl-button--raised' : false,
      this.rippleClass(),
    ];
  }

  menuClassList() {
    return [
      'mdl-menu',
      'mdl-menu--bottom-left', // FIXME
      'mdl-js-menu',
      this.rippleClass(),
    ];
  }

  itemNodes() {
    // introspect children to form mdl-menu__item li tags
    // because MDL hates shadow dom
    const items = [];
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      const attributes = {};
      if (child.hasAttribute('disabled')) {
        attributes.disabled = true;
      }
      items.push(h('li', {
        attributes,
        className: [
          'mdl-menu__item',
          child.hasAttribute('divider') ? 'mdl-menu__item--full-bleed-divider' : false,
        ].filter(Boolean).join(' '),
      }, child.innerText));
    }
    return items;
  }

  createDOM() {
    var icon = this.getAttribute('label-icon'),
        label = this.getAttribute('label'),
        labelClass = icon ? 'icon' : 'accent',
        labelHTML = icon ? `<i class="material-icons">${icon}</i>` : label,
        rippleClass = this.hasAttribute('noink') ? '' : ' mdl-js-ripple-effect',
        buttonClassName = `mdl-button mdl-js-button mdl-button--${labelClass}${rippleClass}`,
        buttonAttrs = this.hasAttribute('disabled') ? ' disabled' : '',

        menuClass = `mdl-menu mdl-menu--bottom-left mdl-js-menu${rippleClass}`;

    // introspect children to form mdl-menu__item li tags
    // because MDL hates shadow dom
    let itemsHTML = '';
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      const liAttrs = child.hasAttribute('disabled') ? 'disabled' : '';
      const classes = ['mdl-menu__item'];
      if (child.hasAttribute('divider')) {
        classes.push('mdl-menu__item--full-bleed-divider');
      }
      itemsHTML += `<li ${liAttrs} class="${classes.join(' ')}">${child.innerHTML}</li>`;
    }

    this.createShadowRoot().innerHTML = `
      <style>${CSS_BUTTON}${CSS_MATERIAL_ICONS}${CSS_MENU}${CSS_RIPPLE}${CSS_TYPOGRAPHY}</style>
      <div id="menu-container">
        <button id="menu-label" class="${buttonClassName}"${buttonAttrs}>${labelHTML}</button>
        <ul class="${menuClass}" for="menu-label">
          ${itemsHTML}
        </ul>
      </div>
    `;
  }
}

export default function() {
  document.registerElement('mdl-menu', MDLMenu);
}
