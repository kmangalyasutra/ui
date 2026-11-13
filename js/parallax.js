/* mangalyasutra.com V2: subtle parallax, scroll reveals and anchor focus.
   - Moves only elements marked data-parallax="speed" (small numbers: 0.05 to 0.15), with transform only.
   - Work is limited to elements near the viewport and batched in requestAnimationFrame.
   - Does nothing (static page) when the visitor prefers reduced motion. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* Anchor links: CSS gives the smooth scroll; here we also move keyboard focus to the target. */
  window.addEventListener('hashchange', focusHash);
  function focusHash() {
    var id = decodeURIComponent(location.hash.slice(1)), el = id && document.getElementById(id);
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (!mq || mq.matches || !('IntersectionObserver' in window)) return;

  var items = [], pending = [], ticking = false, running = false, io, bar;

  function start() {
    if (running) return;
    running = true;
    root.classList.add('anim');

    /* Reveal on scroll: fade/slide up once. Items already on screen at load stay put (no flash). */
    var sel = '.why-card,.family-card,.step,.steps-cta,.browse-card,.tile,.faq details,.contact-visual,.contact-card,.s-cta .wrap,.section-head,.title,.kicker,.lede,.feat,.chips a';
    var seen = new Map();
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      var p = el.parentElement, n = seen.get(p) || 0;
      seen.set(p, n + 1);
      el.classList.add('reveal');
      if (el.matches('.family-card,.contact-visual')) el.classList.add('from-left');
      else if (el.matches('.contact-card,.browse-card')) el.classList.add('from-right');
      else if (el.matches('.title,.kicker,.lede')) el.classList.add('from-fade');
      el.style.setProperty('--rd', Math.min(n, 4) * 70 + 'ms');
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in');
    });
    pending = [].slice.call(document.querySelectorAll('.reveal:not(.in)'));

    /* Parallax: translateY from the distance between the parent's centre and the viewport centre. */
    items = [].map.call(document.querySelectorAll('[data-parallax]'), function (el) {
      var ref = el.parentElement;
      return { el: el, ref: ref, speed: parseFloat(el.getAttribute('data-parallax')) || 0, img: el.tagName === 'IMG' || el.hasAttribute('data-oversized'), vis: false };
    });
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        items.forEach(function (it) { if (it.ref === e.target) it.vis = e.isIntersecting; });
      });
      schedule();
    }, { rootMargin: '25% 0px 25% 0px' });
    var refs = [];
    items.forEach(function (it) { if (refs.indexOf(it.ref) < 0) { refs.push(it.ref); io.observe(it.ref); } });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    schedule();
  }

  function stop() {
    running = false;
    root.classList.remove('anim');
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (io) io.disconnect();
    if (bar) { bar.remove(); bar = null; }
    root.classList.remove('scrolled');
    pending = [];
    items.forEach(function (it) { it.el.style.transform = ''; });
    [].forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.remove('reveal', 'in'); });
  }

  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function update() {
    ticking = false;
    if (!running) return;
    var vh = window.innerHeight;
    var max = root.scrollHeight - vh, y0 = window.pageYOffset || root.scrollTop;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y0 / max) : 0).toFixed(4) + ')';
    root.classList.toggle('scrolled', y0 > 8);
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.9) { el.classList.add('in'); return false; }
      return true;
    });
    var damp = window.innerWidth < 640 ? 0.55 : 1;
    items.forEach(function (it) {
      if (!it.vis) return;
      var r = it.ref.getBoundingClientRect();
      var y = -((r.top + r.height / 2) - vh / 2) * it.speed * damp;
      if (it.img) { var m = r.height * 0.09; y = Math.max(-m, Math.min(m, y)); }   // images are oversized by 10%
      it.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }

  start();
  var onChange = function () { if (mq.matches) stop(); else start(); };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
})();
