import 'material-design-lite/dist/material';

import CSS_MATERIAL_ICONS from './common/material-icons.scss';
import registerBadge      from './mdl-badge';
import registerButton     from './mdl-button';
import registerGrid       from './mdl-grid';
import registerLayout     from './mdl-layout';
import registerMenu       from './mdl-menu';
import registerSwitch     from './mdl-switch';
import registerTextfield  from './mdl-textfield';

// pre-load Material Icons font
let headEl = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
let styleEl = document.createElement('style');
headEl.appendChild(styleEl);
styleEl.setAttribute('type', 'text/css');
styleEl.textContent = CSS_MATERIAL_ICONS;

// register components
registerBadge();
registerButton();
registerGrid();
registerLayout();
registerMenu();
registerSwitch();
registerTextfield();
