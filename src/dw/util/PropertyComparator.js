'use strict';
const List = require('./List');
class PropertyComparator {
  constructor(property, sortOrder, nullGreater) {
    // (property, sortOrder=true asc) or (property, otherProperty, sortOrder)
    this._props = [];
    if (typeof sortOrder === 'string') { this._props.push([property, true]); this._props.push([sortOrder, nullGreater !== false]); }
    else this._props.push([property, sortOrder !== false]);
    this._nullGreater = !!nullGreater;
  }
  compare(a, b) {
    for (const [p, asc] of this._props) {
      const va = getPath(a, p); const vb = getPath(b, p);
      let r;
      if (va == null && vb == null) r = 0;
      else if (va == null) r = this._nullGreater ? 1 : -1;
      else if (vb == null) r = this._nullGreater ? -1 : 1;
      else r = List.cmp(va, vb);
      if (r !== 0) return asc ? r : -r;
    }
    return 0;
  }
}
function getPath(o, p) { return String(p).split('.').reduce((x, k) => (x == null ? x : x[k]), o); }
module.exports = PropertyComparator;
