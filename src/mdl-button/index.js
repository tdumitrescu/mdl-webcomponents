import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLButton extends MDLComponent {
  get MDL_SELECTORS() {
    return ['button'];
  }

  get config() {
    return {
      css,
      template,
      useShadowDom: true,
      helpers: {
        buttonModClass: () => {
          let suffix;
          if (this.isAttributeEnabled('fab')) {
            suffix = 'fab';
          } else if (!!this.getAttribute('icon')) {
            suffix = 'icon';
          } else {
            suffix = 'accent';
          }
          return `mdl-button--${suffix}`;
        }
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-button', MDLButton);
}
