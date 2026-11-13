/* mangalyasutra.com V2: Highlighted Profiles auto-scroll. Duplicates the cards for a seamless loop;
   pauses on hover/focus; with reduced motion the row stays still and can be swiped or scrolled by hand. */
(function () {
  'use strict';
  var list = document.querySelector('.pgrid');
  if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  [].slice.call(list.children).forEach(function (li) {
    var c = li.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    [].forEach.call(c.querySelectorAll('a,button'), function (a) { a.tabIndex = -1; });
    list.appendChild(c);
  });
  list.classList.add('is-auto');
})();
