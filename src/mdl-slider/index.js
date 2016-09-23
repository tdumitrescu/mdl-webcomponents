import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLSlider extends MDLComponent {
  get MDL_SELECTORS() {
    return ['.mdl-slider'];
  }

  get config() {
    return {
      css,
      template,
      useShadowDom: true,
    };
  }

  get inputEl() {
    return this.el.querySelector('input.mdl-slider');
  }

  get value() {
    return this.inputEl.value;
  }
}

export default function() {
  document.registerElement('mdl-slider', MDLSlider);
}
