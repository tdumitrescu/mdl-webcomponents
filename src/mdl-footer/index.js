import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

export class MDLFooter extends MDLComponent {
  get config() {
    return {
      css,
      template,
      useShadowDom: true,
      helpers: {
        footerType: () => this.isAttributeEnabled('mega') ? 'mega' : 'mini',
        sections: () => Array.from(this.children)
          .filter(el => el.tagName.toLowerCase() === 'mdl-footer-section'),
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-footer', MDLFooter);
}
