import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import registerButton    from './mdl-button';
import registerMenu      from './mdl-menu';
import registerSwitch    from './mdl-switch';
import registerTextfield from './mdl-textfield';

// pre-load Material Icons font
let headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
let styleEl = document.createElement('style');
headEl.appendChild(styleEl);
styleEl.setAttribute('type', 'text/css');
styleEl.textContent = CSS_MATERIAL_ICONS;

// register components
registerButton();
registerMenu();
registerSwitch();
registerTextfield();
