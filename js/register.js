/* mangalyasutra.com V2: the Register Free pop-up (name, mobile, gender, age), then a one-time code.
   A number that is already registered gets a login code instead, so there is no separate login page. */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('reg-dialog');
  if (!dlg) return;
  var form = $('rg-form'), otp = $('rg-otp'), ok = $('rg-ok');
  var submitBtn = $('rg-submit'), otpBtn = $('rg-otp-submit'), formErr = $('rg-form-err'), otpErr = $('rg-otp-err');
  var codeEl = $('rg-code'), mobileEl = $('rg-mobile');
  var pending = { mobile: '', name: '' }, resendTimer = null, root = document.documentElement;

  /* ---------- open / close ---------- */
  function openDlg() {
    var nav = $('site-nav'), tog = $('nav-toggle');                 // close the phone menu first
    if (nav && nav.classList.contains('open')) { nav.classList.remove('open'); if (tog) tog.setAttribute('aria-expanded', 'false'); }
    if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    root.classList.add('no-scroll');
    var first = !form.hidden ? $('rg-name') : (!otp.hidden ? codeEl : null);
    if (first) first.focus();
  }
  function closeDlg() {
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
    root.classList.remove('no-scroll');
  }
  dlg.addEventListener('close', function () { root.classList.remove('no-scroll'); });
  dlg.addEventListener('cancel', function () { root.classList.remove('no-scroll'); });
  $('rg-close').addEventListener('click', closeDlg);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });   // click on the backdrop
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-open-register]');
    if (!t) return;
    e.preventDefault();
    openDlg();
  });
  if (location.hash === '#register') {
    history.replaceState(null, '', location.pathname + location.search);
    openDlg();
  }

  /* ---------- validation ---------- */
  var rules = {
    name: function (f) { var v = f.name.value.trim(); return v.length >= 2 && /^[\p{L}\p{M} .'\-]+$/u.test(v) ? '' : 'Enter your full name (letters only).'; },
    mobile: function (f) { return /^[6-9]\d{9}$/.test(f.mobile.value) ? '' : 'Enter a valid 10-digit mobile number.'; },
    gender: function (f) { return f.gender.value ? '' : 'Select Male or Female.'; },
    age: function (f) {
      /* The age list itself starts at the legal marriageable age (men 21, women 18), so no minimum-age message is needed. */
      var min = f.gender.value === 'Male' ? 21 : 18;
      if (!f.age.value) return 'Select your age.';
      return +f.age.value >= min && +f.age.value <= 60 ? '' : 'Select your age.';
    },
    tongue: function (f) { return f.tongue.value ? '' : 'Select your mother tongue.'; },
    district: function (f) { return f.district.value ? '' : 'Select your district.'; }
  };
  function syncAges() {                      // list only legal ages for the chosen gender (Indian law: 21 men, 18 women)
    var min = form.gender.value === 'Male' ? 21 : 18, sel = form.age, keep = sel.value;
    [].forEach.call(sel.options, function (o) { if (o.value) { var hide = +o.value < min; o.hidden = hide; o.disabled = hide; } });
    if (keep && +keep < min) sel.value = '';
  }
  var order = ['name', 'mobile', 'gender', 'age', 'tongue', 'district'];
  var targets = { name: 'rg-name', mobile: 'rg-mobile', gender: 'rg-male', age: 'rg-age', tongue: 'rg-tongue', district: 'rg-district' };
  var wrap = function (k) { return form.querySelector('[data-field="' + k + '"]'); };
  function show(k, msg) {
    wrap(k).classList.toggle('has-error', !!msg);
    $('rg-' + k + '-err').textContent = msg || '';
    [].forEach.call(wrap(k).querySelectorAll('input,select'), function (el) {
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    });
  }
  function check(k) { var m = rules[k](form.elements); show(k, m); return m; }

  mobileEl.addEventListener('input', function () { mobileEl.value = mobileEl.value.replace(/\D/g, '').slice(0, 10); });
  codeEl.addEventListener('input', function () { codeEl.value = codeEl.value.replace(/\D/g, '').slice(0, 6); });
  $('rg-name').addEventListener('blur', function () { if (this.value) check('name'); });
  mobileEl.addEventListener('blur', function () { if (this.value) check('mobile'); });
  [].forEach.call(form.elements.gender, function (r) { r.addEventListener('change', function () { syncAges(); check('gender'); if (form.age.value) check('age'); formErr.textContent = ''; }); });
  $('rg-age').addEventListener('change', function () { check('age'); formErr.textContent = ''; });
  ['tongue', 'district'].forEach(function (k) { $('rg-' + k).addEventListener('change', function () { check(k); formErr.textContent = ''; }); });

  /* ---------- network ---------- */
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(data) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.error || 'Something went wrong. Please try again.'); e.code = r.status; e.body = j; throw e; }
          return j;
        });
      });
  }
  function busy(btn, on, label) { btn.disabled = on; btn.textContent = on ? 'Please wait...' : label; }

  /* ---------- step 1: details ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;
    formErr.textContent = '';
    var first = null;
    order.forEach(function (k) { if (check(k) && !first) first = k; });
    if (first) { $(targets[first]).focus(); return; }

    var name = form.name.value.trim(), mobile = '+91' + form.mobile.value;
    busy(submitBtn, true);
    post('/api/register', {
      /* coupon (#rg-coupon) is collected in the form but not sent yet: backend support to follow */
      name: name, mobile: mobile, gender: form.gender.value, age: Number(form.age.value),
      motherTongue: form.tongue.value, district: form.district.value,
      company: form.company.value,
      consent: { accepted: true, at: new Date().toISOString(), policyVersion: cfg.policyVersion || null }
    }).then(function (j) {
      busy(submitBtn, false, 'Register Free');
      showOtp(j.mobile || mobile, name, j.devCode, false);
    }).catch(function (err) {
      if (err.code === 409) {                       // already a member: send a login code instead
        return post('/api/login', { mobile: mobile }).then(function (j) {
          busy(submitBtn, false, 'Register Free');
          showOtp(j.mobile || mobile, name, j.devCode, true);
        }).catch(function (e2) { busy(submitBtn, false, 'Register Free'); formErr.textContent = e2.message; });
      }
      busy(submitBtn, false, 'Register Free');
      var fe = err.body && err.body.errors, bad = null;
      if (fe) order.forEach(function (k) { if (fe[k]) { show(k, fe[k]); if (!bad) bad = k; } });
      if (bad) { $(targets[bad]).focus(); return; }
      formErr.textContent = err.code === 429 ? err.message : 'We could not register you. Please check your connection and try again.';
    });
  });

  /* ---------- step 2: one-time code ---------- */
  function devNote(code) {
    var n = $('rg-dev');
    n.hidden = !code;
    if (code) n.textContent = 'Test mode: your code is ' + code + '.';
  }
  function cooldown() {
    var b = $('rg-resend'), left = 30;
    b.disabled = true;
    clearInterval(resendTimer);
    b.textContent = 'Send the code again in ' + left + 's';
    resendTimer = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(resendTimer); b.disabled = false; b.textContent = 'Send the code again'; }
      else b.textContent = 'Send the code again in ' + left + 's';
    }, 1000);
  }
  function showOtp(mobile, name, devCode, returning) {
    pending.mobile = mobile; pending.name = name;
    $('rg-otp-title').textContent = returning ? 'Welcome back' : 'Verify your mobile';
    $('rg-otp-mobile').textContent = mobile.replace('+91', '+91 ');
    form.hidden = true; otp.hidden = false;
    otpErr.textContent = ''; codeEl.value = ''; show2('');
    devNote(devCode); cooldown(); codeEl.focus();
  }
  function show2(msg) {
    otp.querySelector('[data-field="code"]').classList.toggle('has-error', !!msg);
    $('rg-code-err').textContent = msg || '';
    if (msg) codeEl.setAttribute('aria-invalid', 'true'); else codeEl.removeAttribute('aria-invalid');
  }
  $('rg-change').addEventListener('click', function () {
    otp.hidden = true; form.hidden = false; clearInterval(resendTimer); $('rg-mobile').focus();
  });
  $('rg-resend').addEventListener('click', function () {
    post('/api/login', { mobile: pending.mobile }).then(function (j) {
      devNote(j.devCode); cooldown(); otpErr.textContent = '';
    }).catch(function (err) { otpErr.textContent = err.message; });
  });
  otp.addEventListener('submit', function (e) {
    e.preventDefault();
    if (otpBtn.disabled) return;
    otpErr.textContent = '';
    if (!/^\d{6}$/.test(codeEl.value)) { show2('Enter the 6-digit code.'); codeEl.focus(); return; }
    show2('');
    busy(otpBtn, true);
    post('/api/verify', { mobile: pending.mobile, code: codeEl.value }).then(function () {
      $('rg-ok-name').textContent = pending.name.split(/\s+/)[0];
      otp.hidden = true; ok.hidden = false; ok.focus();
      setTimeout(function () { location.href = 'app.html'; }, 1400);
    }).catch(function (err) {
      busy(otpBtn, false, 'Verify and continue');
      otpErr.textContent = err.message; codeEl.focus();
    });
  });
})();
