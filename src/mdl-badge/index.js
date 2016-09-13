import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLBadge extends MDLComponent {
  get config() {
    return {
      css,
      template,
      useShadowDom: true,
    };
  }
}

export default function() {
  document.registerElement('mdl-badge', MDLBadge);
}
