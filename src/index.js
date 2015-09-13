import CSS_MATERIAL_ICONS from './cssjs/material-icons.css';
import registerButton from './material-button';
import registerInput  from './material-input';

// pre-load Material Icons font
let headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement,
  styleEl = document.createElement('style');
headEl.appendChild(styleEl);
styleEl.setAttribute('type', 'text/css');
styleEl.textContent = CSS_MATERIAL_ICONS;

// register components
registerButton();
registerInput();
