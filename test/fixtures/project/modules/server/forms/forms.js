'use strict';
/** Converts a dw.web.FormGroup into a plain object the way SFRA does. */
function parseForm(form) {
  const result = { valid: form.valid, htmlName: form.htmlName, dynamicHtmlName: form.dynamicHtmlName, error: form.error, attributes: `name="${form.htmlName}" id="${form.htmlName}"`, formType: 'formGroup' };
  Object.keys(form).forEach((key) => {
    const el = form[key];
    if (!el || typeof el !== 'object' || !el.formType && !(el.getFormId)) return;
    if (el.constructor && el.constructor.name === 'FormField') {
      result[key] = { valid: el.valid, htmlValue: el.htmlValue, value: el.value, htmlName: el.htmlName, label: el.label, error: el.error, mandatory: el.mandatory, maxLength: el.maxLength, minLength: el.minLength, regEx: el.regEx, formType: 'formField', dynamicHtmlName: el.dynamicHtmlName, checked: el.checked, selected: el.selected, options: el.options ? el.options.toArray().map((o) => ({ checked: o.checked, htmlValue: o.htmlValue, label: o.label, id: o.optionId, selected: o.selected, value: o.value })) : [], attributes: `name="${el.htmlName}" ${el.mandatory ? 'required' : ''}` };
    } else if (el.constructor && el.constructor.name === 'FormAction') {
      result[key] = { description: el.description, label: el.label, submitted: el.submitted, triggered: el.triggered, formType: 'formAction' };
    } else if (typeof el.getFormId === 'function') {
      result[key] = parseForm(el);
    }
  });
  return result;
}
module.exports = function (session) {
  return {
    getForm(name) {
      const currentForm = session.forms[name];
      if (!currentForm) throw new Error(`Form ${name} not found`);
      const result = parseForm(currentForm);
      result.base = currentForm;
      result.clear = function () { currentForm.clearFormElement(); };
      result.copyFrom = function (obj) { currentForm.copyFrom(obj); };
      result.copyTo = function (obj) { currentForm.copyTo(obj); };
      return result;
    },
  };
};
