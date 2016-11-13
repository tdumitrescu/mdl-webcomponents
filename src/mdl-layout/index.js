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
            const rows = [];
            let rowEls = this.querySelectorAll('mdl-header-row');
            if (!rowEls.length) {
              rowEls = [headerEl];
            }
            for (let ri = 0; ri < rowEls.length; ri++) {
              rows.push(this.headerRowData(rowEls[ri]));
            }

            const tabBarEl = headerEl.querySelector('mdl-tab-bar');
            let tabs = null;
            if (tabBarEl) {
              tabs = [];
              let tabEls = tabBarEl.querySelectorAll('mdl-tab');
              for (let ti = 0; ti < tabEls.length; ti++) {
                const tabEl = tabEls[ti];
                tabs.push({
                  active: tabEl.hasAttribute('active'),
                  target: `#${tabEl.getAttribute('target')}`,
                  text: tabEl.textContent, // TODO non-text content
                });
              }
            }

            return {rows, tabs};
          } else {
            return null;
          }
        },

        sections: () => {
          const sections = [];
          const sectionEls = this.querySelectorAll('mdl-layout-section');
          for (let si = 0; si < sectionEls.length; si++) {
            const sectionEl = sectionEls[si];
            sections.push({
              active: sectionEl.hasAttribute('active'),
              contentSelect: `[target=${sectionEl.getAttribute('target')}]`,
              id: sectionEl.getAttribute('target'),
            });
          }
          return sections;
        },
      },
    };
  }

  headerRowData(rowEl) {
    const items = [];
    for (let i = 0; i < rowEl.children.length; i++) {
      const el = rowEl.children[i];
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
          items.push({type: 'content', select: this.insertContent(el)});
          break;
      }
    }
    return items;
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
