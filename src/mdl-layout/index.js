import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLLayout extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-layout'];
  }

  get config() {
    return {
      css,
      template,
      useShadowDom: true,
    };
  }
}

export default function() {
  document.registerElement('mdl-layout', MDLLayout);
}
