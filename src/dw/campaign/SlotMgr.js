'use strict';
const SlotContent = require('./SlotContent');
/** data/slots.json: { slotID: { template, contentType, content: [...], calloutMsg, custom } } – used by <isslot>. Not a real dw class but referenced by the ISML engine. */
module.exports = {
  render(attrs, pdict) {
    const rt = require('../../runtime').current();
    const slots = rt.store.get('slots', {});
    const cfg = slots[attrs.id];
    if (!cfg) return `<!-- slot ${attrs.id} not configured -->`;
    const slotcontent = new SlotContent(Object.assign({ slotID: attrs.id }, cfg));
    const template = cfg.template;
    if (!template) return '';
    const file = rt.resolveTemplate(template);
    if (!file) return `<!-- slot template ${template} not found -->`;
    return rt.isml.render(file, Object.assign({}, pdict, { slotcontent }), { slotcontent });
  },
};
