/* mangalyasutra.com V2: hero background carousel. Slow cross-fade every 7 seconds with indicator dots only.
   Pauses while the pointer or keyboard focus is inside the hero, and while the tab is hidden; with reduced motion it never auto-plays.
   Left/Right arrow keys change the photo when focus is on the hero controls. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var slides = [].slice.call(document.querySelectorAll('.hero-slides .hero-bg'));
  var ctl = document.querySelector('.hero-dots');
  if (!hero || slides.length < 2 || !ctl) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = null, held = false, DELAY = 7000, dots = [];

  var chevron = function (d) { return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; };
  function arrow(label, dir, path) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hero-arrow'; b.setAttribute('aria-label', label); b.innerHTML = chevron(path);
    b.addEventListener('click', function () { show(cur + dir); restart(); });
    return b;
  }
  slides.forEach(function (_, i) {
    var d = document.createElement('button');
    d.type = 'button'; d.className = 'hero-dot'; d.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
    d.addEventListener('click', function () { show(i); restart(); });
    ctl.appendChild(d); dots.push(d);
  });
  ctl.hidden = false;

  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); });
    dots.forEach(function (d, k) { d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
  }
  function stop() { clearInterval(timer); timer = null; }
  function restart() {
    stop();
    if (reduce || held || document.hidden) return;
    timer = setInterval(function () { show(cur + 1); }, DELAY);
  }

  hero.addEventListener('mouseenter', function () { held = true; stop(); });
  hero.addEventListener('mouseleave', function () { held = false; restart(); });
  hero.addEventListener('focusin', function () { held = true; stop(); });
  hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { held = false; restart(); } });
  ctl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(cur - 1); restart(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { show(cur + 1); restart(); e.preventDefault(); }
  });
  document.addEventListener('visibilitychange', restart);

  show(0);
  restart();
})();
