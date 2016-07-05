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
      helpers: {
        drawer: () => {
          const items = [];
          const hostNav = this.querySelectorAll('mdl-layout-drawer nav a');
          for (let i = 0; i < hostNav.length; i++) {
            const item = hostNav[i];
            items.push({href: item.href, content: item.innerHTML});
          }
          return {
            title: this.querySelector('mdl-layout-drawer title').innerHTML,
            items,
          };
        },
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-layout', MDLLayout);
}
