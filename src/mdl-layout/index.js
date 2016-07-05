import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

let layoutInsertID = 1;
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
          const drawerEl = this.querySelector('mdl-layout-drawer');
          if (drawerEl) {
            return {
              title: drawerEl.querySelector('title').innerHTML,
              items: this.navData(drawerEl.querySelector('nav')),
            };
          } else {
            return null;
          }
        },

        header: () => {
          const headerEl = this.querySelector('header');
          if (headerEl) {
            const items = [];
            for (let i = 0; i < headerEl.children.length; i++) {
              const el = headerEl.children[i];
              switch(el.tagName) {
                case 'MDL-HEADER-SPACER':
                  items.push({type: 'spacer'});
                  break;
                case 'NAV':
                  items.push({type: 'nav', items: this.navData(el)});
                  break;
                case 'TITLE':
                  items.push({type: 'title', content: el.innerHTML});
                  break;
                default:
                  // create content insertion point
                  const contentClass = `mdl-wc-layout-insert-${layoutInsertID++}`;
                  const contentEl = document.createElement('div');
                  contentEl.className = contentClass;
                  contentEl.appendChild(el.cloneNode(true));
                  this.appendChild(contentEl);
                  items.push({type: 'content', select: `.${contentClass}`});
                  break;
              }
            }
            return [items];
          } else {
            return null;
          }
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
