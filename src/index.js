import 'material-design-lite/dist/material';

import CSS_MATERIAL_ICONS from './common/material-icons.scss';
import registerBadge      from './mdl-badge';
import registerButton     from './mdl-button';
import registerGrid       from './mdl-grid';
import registerIcon       from './mdl-icon';
import registerLayout     from './mdl-layout';
import registerMenu       from './mdl-menu';
import registerSlider     from './mdl-slider';
import registerSwitch     from './mdl-switch';
import registerTextfield  from './mdl-textfield';

import { injectGlobalCSS } from './util';

// pre-load Material Icons font
injectGlobalCSS(CSS_MATERIAL_ICONS);

// register components
registerBadge();
registerButton();
registerGrid();
registerIcon();
registerLayout();
registerMenu();
registerSlider();
registerSwitch();
registerTextfield();
