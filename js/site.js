/* mangalyasutra.com: behaviours shared by the home and registration pages.
   No personal data is stored in the browser or put in the URL (BRD FR-19). */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Legal and contact links come from site-config.js */
  var linkMap = { terms: cfg.termsUrl, privacy: cfg.privacyUrl, contact: cfg.contactUrl };
  [].forEach.call(document.querySelectorAll('[data-link]'), function (a) {
    var url = linkMap[a.getAttribute('data-link')];
    if (url && url !== '#') { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* Top menu (phones: toggle) */
  var navBtn = document.getElementById('nav-toggle'), nav = document.getElementById('site-nav');
  if (navBtn && nav) {
    var closeNav = function () { nav.classList.remove('open'); navBtn.setAttribute('aria-expanded', 'false'); };
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeNav(); navBtn.focus(); } });
  }

})();

/* Back-to-top button: shows after one screen of scrolling */
(function () {
  'use strict';
  var b = document.getElementById('to-top');
  if (!b) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var update = function () { b.hidden = window.scrollY < 600; };
  window.addEventListener('scroll', update, { passive: true });
  b.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var h = document.getElementById('main') || document.body;
  });
  update();
})();
