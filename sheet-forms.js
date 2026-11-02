/*
 * Sheet Forms embed script.
 * Add data-sheet-form="<your Apps Script web app URL>" to any <form>, include this script, done.
 *
 * Optional attributes on the <form>:
 *   data-sheet="Tab Name"          which tab to write to (must be in ALLOWED_SHEETS)
 *   data-success="Thanks!"         message after a good submit
 *   data-error="Something broke"   message after a failed submit
 *   data-redirect="/thank-you"     send the visitor here after a good submit
 */
(function () {
  function setup(form) {
    if (form.__sheetForm) return;
    form.__sheetForm = true;

    var loadedAt = Date.now();

    // Hidden honeypot field. Bots fill it, people don't see it.
    var hp = document.createElement('input');
    hp.type = 'text';
    hp.name = '_hp';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(hp);

    var status = form.querySelector('[data-sheet-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-sheet-status', '');
      form.appendChild(status);
    }
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var button = form.querySelector('[type="submit"]');
      var buttonText = button && (button.value || button.textContent);
      if (button) { button.disabled = true; }
      form.setAttribute('data-state', 'sending');
      status.textContent = 'Sending...';

      var body = new URLSearchParams();
      new FormData(form).forEach(function (value, key) {
        if (typeof value === 'string') body.append(key, value); // skip file inputs
      });
      body.append('_t', String(loadedAt));
      body.append('_page', location.href);
      if (form.dataset.sheet) body.append('_sheet', form.dataset.sheet);

      // URL-encoded body keeps this a "simple" request, so no CORS preflight.
      fetch(form.dataset.sheetForm, { method: 'POST', body: body })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.error || 'Submission failed');
          form.setAttribute('data-state', 'success');
          form.reset();
          status.textContent = form.dataset.success || 'Thanks! We got your message.';
          form.dispatchEvent(new CustomEvent('sheetform:success', { bubbles: true }));
          if (form.dataset.redirect) location.href = form.dataset.redirect;
        })
        .catch(function (err) {
          form.setAttribute('data-state', 'error');
          status.textContent = form.dataset.error || 'Something went wrong. Please try again.';
          form.dispatchEvent(new CustomEvent('sheetform:error', { bubbles: true, detail: err }));
        })
        .finally(function () {
          if (button) { button.disabled = false; }
          if (button && buttonText && button.tagName === 'BUTTON') button.textContent = buttonText;
        });
    });
  }

  function init() {
    document.querySelectorAll('form[data-sheet-form]').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.SheetForms = { init: init };
})();
