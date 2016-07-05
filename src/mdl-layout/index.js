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
        drawer: () => ({
          title: this.querySelector('mdl-layout-drawer title').innerHTML,
          items: this.navData(this.querySelector('mdl-layout-drawer nav')),
        }),

        header: () => {
          const items = [];
          const headerEl = this.querySelector('header');
          for (let i = 0; i < headerEl.children.length; i++) {
            const el = headerEl.children[i];
            switch(el.tagName) {
              case 'MDL-HEADER-CONTENT':
                items.push({type: 'content', select: el.getAttribute('select')});
                break;
              case 'MDL-HEADER-SPACER':
                items.push({type: 'spacer'});
                break;
              case 'NAV':
                items.push({type: 'nav', items: this.navData(el)});
                break;
              case 'TITLE':
                items.push({type: 'title', content: el.innerHTML});
                break;
            }
          }
          return [items];
        },
      },
    };
  }

  navData(el) {
    const items = [];
    const links = el.querySelectorAll('a');
    for (let i = 0; i < links.length; i++) {
      const item = links[i];
      items.push({href: item.href, content: item.innerHTML});
    }
    return items;
  }
}

export default function() {
  document.registerElement('mdl-layout', MDLLayout);
}
