import { MDLComponent } from '../component';
import template from './index.jade';
import css from './index.scss';

let cellTargetID = 1;
function generateTarget(cellEl) {
  const target = `mdl-cell-${cellTargetID++}`;
  cellEl.setAttribute('target', target);
  return target;
}

export class MDLGrid extends MDLComponent {
  get config() {
    return {
      css,
      template,
      useShadowDom: true,
      helpers: {
        cells: () => {
          const cells = [];
          const cellEls = this.querySelectorAll('mdl-cell');
          for (let ci = 0; ci < cellEls.length; ci++) {
            const cellEl = cellEls[ci];
            cells.push({
              cols: cellEl.getAttribute('cols'),
              target: cellEl.getAttribute('target') || generateTarget(cellEl),
            });
          }
          return cells;
        },
      },
    };
  }
}

export default function() {
  document.registerElement('mdl-grid', MDLGrid);
}
