/* mangalyasutra.com V2: home-page contact form (validation, send, success and error states)
   and the optional support lines from site-config.js. */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};

  var lines = document.getElementById('contact-lines'), bits = [];
  if (cfg.supportPhone) bits.push('Phone: ' + cfg.supportPhone);
  if (cfg.supportWhatsApp) bits.push('WhatsApp: +' + cfg.supportWhatsApp.replace(/\D/g, ''));
  if (cfg.supportHours) bits.push('Hours: ' + cfg.supportHours);
  if (lines && bits.length) { lines.textContent = bits.join('  |  '); lines.hidden = false; }

  var form = document.getElementById('contact-form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var ok = $('cf-success'), formErr = $('cf-form-err'), btn = $('cf-submit'), count = $('cf-count');
  var names = ['name', 'email', 'phone', 'subject', 'message'];
  var SUBJECTS = ['General Enquiry', 'Franchise Partnership Opportunity', 'Report an Issue'];

  var rules = {
    name: function (v) { return v.length >= 2 && /^[\p{L}\p{M} .'\-]+$/u.test(v) ? '' : 'Enter your full name (letters only).'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Enter a valid email address.'; },
    phone: function (v) { return /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '').replace(/^\+91/, '')) ? '' : 'Enter a valid 10-digit mobile number.'; },
    subject: function (v) { return SUBJECTS.indexOf(v) >= 0 ? '' : 'Select a reason for contact.'; },
    message: function (v) { return v.length >= 10 ? '' : 'Please write at least 10 characters.'; }
  };
  var field = function (n) { return form.querySelector('[data-field="' + n + '"]'); };
  var input = function (n) { return $('cf-' + n); };
  var val = function (n) { return input(n).value.trim(); };

  function show(n, msg) {
    var f = field(n), i = input(n);
    f.classList.toggle('has-error', !!msg);
    f.classList.toggle('is-valid', !msg && !!val(n));
    $('cf-' + n + '-err').textContent = msg || '';
    if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
  }
  function check(n) { var m = rules[n](val(n)); show(n, m); return m; }

  names.forEach(function (n) {
    var i = input(n);
    i.addEventListener('blur', function () { if (val(n)) check(n); });
    i.addEventListener('input', function () { if (field(n).classList.contains('has-error')) check(n); });
  });
  input('phone').addEventListener('input', function () { this.value = this.value.replace(/[^\d]/g, '').slice(0, 10); });
  input('message').addEventListener('input', function () { count.textContent = this.value.length + ' / 1000'; });

  function busy(on) { btn.disabled = on; btn.textContent = on ? 'Sending...' : 'Send message'; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formErr.textContent = '';
    var first = null;
    names.forEach(function (n) { if (check(n) && !first) first = n; });
    if (first) { input(first).focus(); return; }

    var body = { company: $('cf-company').value };
    names.forEach(function (n) { body[n] = val(n); });
    busy(true);
    fetch(cfg.contactEndpoint || '/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    }).then(function (res) {
      busy(false);
      if (res.status >= 200 && res.status < 300) {
        $('cf-success-name').textContent = body.name.split(/\s+/)[0];
        form.hidden = true; ok.hidden = false; ok.focus();
        return;
      }
      var errs = res.body && res.body.errors, firstBad = null;
      if (errs) names.forEach(function (n) { if (errs[n]) { show(n, errs[n]); if (!firstBad) firstBad = n; } });
      if (firstBad) input(firstBad).focus();
      else formErr.textContent = (res.body && res.body.error) || (res.status === 429 ? 'Too many messages. Please try again later.' : 'We could not send your message. Please try again.');
    }).catch(function () {
      busy(false);
      formErr.textContent = 'Connection problem. Please check your internet and try again.';
    });
  });

  $('cf-again').addEventListener('click', function () {
    form.reset(); count.textContent = '0 / 1000';
    names.forEach(function (n) { field(n).classList.remove('has-error', 'is-valid'); $('cf-' + n + '-err').textContent = ''; input(n).removeAttribute('aria-invalid'); });
    ok.hidden = true; form.hidden = false; input('name').focus();
  });
})();
