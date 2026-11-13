(function () {
  'use strict';
  /* Member app. All user-supplied text goes through textContent (never innerHTML). */
  var DISTRICTS = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod', 'Outside Kerala'];
  var TONGUES = ['Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Tulu', 'Konkani', 'Other'];
  var RELIGIONS = ['Hindu', 'Christian', 'Muslim', 'Other', 'Prefer not to say'];
  var MARITAL = ['Never married', 'Divorced', 'Widowed'];
  var DIET = ['Vegetarian', 'Non-vegetarian', 'Eggetarian'];

  var view = document.getElementById('view');
  var me = null, myProfile = null, timer = null;

  /* ---------- helpers ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.setAttribute('style', v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }
  function api(method, url, body) {
    return fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401) { location.href = '/#register'; throw new Error('login'); }
          if (!r.ok) { var e = new Error(j.error || 'Something went wrong.'); e.body = j; throw e; }
          return j;
        });
      });
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function select(id, label, options, value, any) {
    var s = h('select', { id: id, name: id }, h('option', { value: '', text: any || 'Select' }));
    options.forEach(function (o) { var op = h('option', { value: o, text: o }); if (o === value) op.selected = true; s.appendChild(op); });
    return h('div', { class: 'field', id: 'f-' + id }, h('label', { for: id, text: label }), s, h('p', { class: 'err', id: id + '-err', role: 'alert' }));
  }
  function input(id, label, value, opts) {
    opts = opts || {};
    return h('div', { class: 'field', id: 'f-' + id }, h('label', { for: id, text: label }),
      h('input', { id: id, name: id, type: opts.type || 'text', value: value == null ? '' : value, maxlength: opts.max, min: opts.min, max: opts.maxv, inputmode: opts.inputmode }),
      h('p', { class: 'err', id: id + '-err', role: 'alert' }));
  }
  function avatar(p) {
    var a = h('div', { class: 'avatar', 'aria-hidden': 'true' });
    if (p.photo) a.style.backgroundImage = 'url("' + p.photo + '")'; else a.textContent = (p.name || '?')[0];
    return a;
  }
  function when(iso) { try { return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; } }
  function showErr(box, e) { box.className = 'msg error'; box.textContent = e.message || 'Something went wrong.'; box.hidden = false; }
  function setActive(name) {
    [].forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function render(title) {
    clearInterval(timer);
    clear(view);
    document.title = title + ' | mangalyasutra.com';
    var main = document.getElementById('main'); main.focus({ preventScroll: true });
    return view;
  }

  /* ---------- Discover ---------- */
  function ageSelect(id, label) {
    var s = h('select', { id: id }, h('option', { value: '', text: 'Any' }));
    for (var a = 18; a <= 60; a++) s.appendChild(h('option', { value: String(a), text: String(a) }));
    return h('div', { class: 'field' }, h('label', { for: id, text: label }), s);
  }
  function discover() {
    render('Discover'); setActive('discover');
    var results = h('div', { class: 'results' });
    var more = h('button', { class: 'btn ghost', type: 'button', hidden: true, text: 'Load more' });
    var status = h('p', { class: 'muted', style: 'margin:12px 0' });
    var f = h('form', { class: 'filters card', novalidate: true, onsubmit: function (e) { e.preventDefault(); load(0); } },
      ageSelect('ageMin', 'Age from'), ageSelect('ageMax', 'Age to'),
      select('district', 'District', DISTRICTS, '', 'Any'), select('motherTongue', 'Mother tongue', TONGUES, '', 'Any'),
      select('religion', 'Religion', RELIGIONS, '', 'Any'), select('maritalStatus', 'Marital status', MARITAL, '', 'Any'),
      h('button', { class: 'btn', type: 'submit', text: 'Search' }));
    f.querySelectorAll('.field').forEach(function (x) { x.style.margin = '0'; });
    view.appendChild(h('h1', { class: 'page-title', text: 'Find your match' }));
    view.appendChild(f);
    view.appendChild(status); view.appendChild(results); view.appendChild(more);
    var nextOffset = 0;
    function params(off) {
      var q = new URLSearchParams();
      ['ageMin', 'ageMax', 'district', 'motherTongue', 'religion', 'maritalStatus'].forEach(function (k) { var v = f.querySelector('#' + k).value; if (v) q.set(k, v); });
      q.set('offset', off); return q.toString();
    }
    function load(off) {
      status.textContent = 'Searching...'; more.hidden = true;
      if (!off) clear(results);
      api('GET', '/api/search?' + params(off)).then(function (j) {
        nextOffset = j.nextOffset;
        j.results.forEach(function (p) { results.appendChild(card(p)); });
        status.textContent = results.children.length ? '' : 'No profiles match these filters yet. Try widening them.';
        more.hidden = nextOffset == null;
      }).catch(function (e) { status.textContent = e.message; });
    }
    more.addEventListener('click', function () { load(nextOffset); });
    load(0);
  }
  function card(p) {
    var line = [p.age ? p.age + ' yrs' : null, p.district].filter(Boolean).join(' · ');
    var sub = [p.occupation, p.education].filter(Boolean).join(' · ');
    return h('article', { class: 'pcard' }, avatar(p),
      h('div', { class: 'body' }, h('h3', { text: p.name }), h('p', { class: 'meta', text: line }),
        sub ? h('p', { class: 'meta', text: sub }) : null,
        h('a', { class: 'btn small', href: '#/view/' + p.id, style: 'margin-top:10px', 'aria-label': 'View profile of ' + p.name }, 'View profile')));
  }

  /* ---------- One profile ---------- */
  function viewProfile(id) {
    render('Profile'); setActive('discover');
    view.appendChild(h('p', { class: 'empty', text: 'Loading...' }));
    api('GET', '/api/profile/' + id).then(function (j) {
      var p = j.profile; clear(view);
      var photos = h('div', { class: 'photos' });
      if (p.photos && p.photos.length) p.photos.forEach(function (src) { photos.appendChild(h('img', { src: src, alt: 'Photo of ' + p.name })); });
      else photos.appendChild(avatar(p));
      var facts = h('ul', { class: 'facts' });
      [['Age', p.age], ['District', p.district], ['Mother tongue', p.motherTongue], ['Religion', p.religion], ['Caste', p.caste], ['Education', p.education], ['Occupation', p.occupation],
        ['Height', p.heightCm ? p.heightCm + ' cm' : null], ['Marital status', p.maritalStatus], ['Diet', p.diet]].forEach(function (r) {
        if (r[1]) facts.appendChild(h('li', {}, h('span', { text: r[0] }), h('b', { text: String(r[1]) })));
      });
      var msg = h('p', { class: 'msg', hidden: true, role: 'status' });
      var actions = h('div', { class: 'actions' });
      function setState(s) {
        clear(actions);
        if (s === 'none' || s === 'declined') actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: function (e) {
          e.target.disabled = true;
          api('POST', '/api/interests', { toId: p.id }).then(function (r) { setState(r.state); msg.className = 'msg ok'; msg.textContent = r.state === 'connected' ? 'You are connected. You can now send messages.' : 'Interest sent.'; msg.hidden = false; })
            .catch(function (er) { e.target.disabled = false; showErr(msg, er); });
        } }, 'Send interest'));
        else if (s === 'sent') actions.appendChild(h('button', { class: 'btn', type: 'button', disabled: true }, 'Interest sent'));
        else if (s === 'received') {
          actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: function () { respond('accept'); } }, 'Accept interest'));
          actions.appendChild(h('button', { class: 'btn ghost', type: 'button', onclick: function () { respond('decline'); } }, 'Decline'));
        } else if (s === 'connected') actions.appendChild(h('a', { class: 'btn', href: '#/chat/' + p.id }, 'Send a message'));
        actions.appendChild(h('button', { class: 'btn ghost', type: 'button', onclick: reportBox }, 'Report'));
      }
      function respond(action) {
        api('POST', '/api/interests/' + j.interestId + '/respond', { action: action }).then(function (r) {
          setState(r.status === 'accepted' ? 'connected' : 'declined');
          msg.className = 'msg ok'; msg.textContent = r.status === 'accepted' ? 'Accepted. You can now message each other.' : 'Declined.'; msg.hidden = false;
        }).catch(function (er) { showErr(msg, er); });
      }
      function reportBox() {
        var ta = h('textarea', { id: 'reason', maxlength: '500' });
        var wrap = h('div', { class: 'card', style: 'margin-top:12px' },
          h('div', { class: 'field' }, h('label', { for: 'reason', text: 'What is wrong with this profile?' }), ta),
          h('button', { class: 'btn danger small', type: 'button', onclick: function () {
            api('POST', '/api/report', { targetId: p.id, reason: ta.value }).then(function () { wrap.remove(); msg.className = 'msg ok'; msg.textContent = 'Thank you. We will review this profile.'; msg.hidden = false; }).catch(function (er) { showErr(msg, er); });
          } }, 'Submit report'));
        view.appendChild(wrap); ta.focus();
      }
      setState(j.state);
      view.appendChild(h('p', {}, h('a', { href: '#/discover', text: '< Back to search' })));
      view.appendChild(h('div', { class: 'pview', style: 'margin-top:12px' }, photos,
        h('div', { class: 'card' }, h('h1', { text: p.name }), p.about ? h('p', { style: 'margin-top:8px', text: p.about }) : null, facts, msg, actions)));
    }).catch(function (e) { clear(view); view.appendChild(h('p', { class: 'empty', text: e.message })); });
  }

  /* ---------- Interests ---------- */
  function interests(box) {
    box = box === 'sent' ? 'sent' : 'received';
    render('Interests'); setActive('interests');
    var list = h('div', { class: 'card' });
    var tabs = h('div', { class: 'tabs', role: 'tablist' });
    ['received', 'sent'].forEach(function (b) {
      tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': b === box ? 'true' : 'false', onclick: function () { location.hash = '#/interests/' + b; } }, b === 'received' ? 'Received' : 'Sent'));
    });
    view.appendChild(h('h1', { class: 'page-title', text: 'Interests' })); view.appendChild(tabs); view.appendChild(list);
    list.appendChild(h('p', { class: 'empty', text: 'Loading...' }));
    api('GET', '/api/interests?box=' + box).then(function (j) {
      clear(list);
      if (!j.items.length) { list.appendChild(h('p', { class: 'empty', text: box === 'received' ? 'No interests received yet.' : 'You have not sent any interests yet.' })); return; }
      j.items.forEach(function (it) {
        var p = it.profile, actions = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
        if (box === 'received' && it.status === 'pending') {
          actions.appendChild(h('button', { class: 'btn small', type: 'button', onclick: function () { go('accept'); } }, 'Accept'));
          actions.appendChild(h('button', { class: 'btn small ghost', type: 'button', onclick: function () { go('decline'); } }, 'Decline'));
        } else actions.appendChild(h('span', { class: 'status', text: it.status[0].toUpperCase() + it.status.slice(1) }));
        if (it.status === 'accepted') actions.appendChild(h('a', { class: 'btn small', href: '#/chat/' + p.id }, 'Message'));
        function go(a) { api('POST', '/api/interests/' + it.id + '/respond', { action: a }).then(function () { interests(box); refreshBadge(); }).catch(function (e) { alert(e.message); }); }
        list.appendChild(h('div', { class: 'row' }, avatar(p),
          h('div', { class: 'grow' }, h('strong', { text: p.name }), h('span', { class: 'muted', text: [p.age ? p.age + ' yrs' : null, p.district].filter(Boolean).join(' · ') + ' · ' + when(it.at) }),
            h('a', { href: '#/view/' + p.id, text: 'View profile' })), actions));
      });
    }).catch(function (e) { clear(list); list.appendChild(h('p', { class: 'empty', text: e.message })); });
  }
  function refreshBadge() {
    api('GET', '/api/interests?box=received').then(function (j) {
      var n = j.items.filter(function (i) { return i.status === 'pending'; }).length, b = document.getElementById('b-int');
      b.textContent = String(n); b.hidden = !n;
    }).catch(function () {});
  }

  /* ---------- Messages ---------- */
  function chat(withId) {
    render('Messages'); setActive('chat');
    var side = h('div', { class: 'card' }), pane = h('div', {});
    view.appendChild(h('h1', { class: 'page-title', text: 'Messages' }));
    view.appendChild(h('div', { class: 'chat' }, side, pane));
    api('GET', '/api/connections').then(function (j) {
      clear(side);
      if (!j.items.length) { side.appendChild(h('p', { class: 'empty', text: 'Messages open once an interest is accepted.' })); return; }
      j.items.forEach(function (p) {
        side.appendChild(h('a', { class: 'row', href: '#/chat/' + p.id, style: 'text-decoration:none;color:inherit', 'aria-current': p.id === withId ? 'true' : null }, avatar(p), h('div', { class: 'grow' }, h('strong', { text: p.name }), h('span', { class: 'muted', text: p.district || '' }))));
      });
      if (withId) openThread(withId, j.items);
      else pane.appendChild(h('p', { class: 'empty', text: 'Choose a conversation.' }));
    }).catch(function (e) { clear(side); side.appendChild(h('p', { class: 'empty', text: e.message })); });

    function openThread(id, items) {
      var p = items.filter(function (x) { return x.id === id; })[0];
      if (!p) { pane.appendChild(h('p', { class: 'empty', text: 'Conversation not found.' })); return; }
      var thread = h('div', { class: 'thread', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation with ' + p.name });
      var err = h('p', { class: 'msg error', hidden: true, role: 'alert' });
      var box = h('input', { type: 'text', id: 'msgbox', maxlength: '1000', 'aria-label': 'Message', autocomplete: 'off' });
      var form = h('form', { class: 'composer', onsubmit: function (e) {
        e.preventDefault();
        var t = box.value.trim(); if (!t) return;
        box.value = ''; err.hidden = true;
        api('POST', '/api/messages', { toId: id, body: t }).then(load).catch(function (er) { showErr(err, er); box.value = t; });
      } }, box, h('button', { class: 'btn', type: 'submit' }, 'Send'));
      pane.appendChild(h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:10px', text: p.name }), thread, err, form));
      var last = '';
      function load() {
        return api('GET', '/api/messages/' + id).then(function (j) {
          var sig = j.messages.map(function (m) { return m.id; }).join(',');
          if (sig === last) return; last = sig; clear(thread);
          if (!j.messages.length) thread.appendChild(h('p', { class: 'empty', text: 'Say namaste to start the conversation.' }));
          j.messages.forEach(function (m) { thread.appendChild(h('div', { class: 'bubble' + (m.mine ? ' mine' : '') }, m.body, h('time', { text: when(m.at) }))); });
          thread.scrollTop = thread.scrollHeight;
        }).catch(function () {});
      }
      load(); timer = setInterval(load, 6000); box.focus();
    }
  }

  /* ---------- My profile ---------- */
  function resize(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 520, s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var q = 0.75, out = c.toDataURL('image/jpeg', q);
        while (out.length > 150000 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
        resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That file is not a readable image.')); };
      img.src = url;
    });
  }
  function myProfileView() {
    render('My profile'); setActive('me');
    var u = me, p = myProfile || {}, photos = (p.photos || []).slice();
    var thumbs = h('div', { class: 'thumbs' });
    function drawThumbs() {
      clear(thumbs);
      photos.forEach(function (src, i) {
        var t = h('div', { class: 'thumb', role: 'img', 'aria-label': 'Photo ' + (i + 1) });
        t.style.backgroundImage = 'url("' + src + '")';
        t.appendChild(h('button', { type: 'button', 'aria-label': 'Remove photo ' + (i + 1), onclick: function () { photos.splice(i, 1); drawThumbs(); } }, '×'));
        thumbs.appendChild(t);
      });
    }
    drawThumbs();
    var photoErr = h('p', { class: 'msg error', hidden: true, role: 'alert' });
    var file = h('input', { type: 'file', id: 'photo', accept: 'image/jpeg,image/png,image/webp', onchange: function () {
      var f = file.files[0]; file.value = ''; photoErr.hidden = true;
      if (!f) return;
      if (photos.length >= 3) { showErr(photoErr, new Error('You can add up to 3 photos.')); return; }
      resize(f).then(function (d) { photos.push(d); drawThumbs(); }).catch(function (e) { showErr(photoErr, e); });
    } });
    var status = h('p', { class: 'msg', hidden: true, role: 'status' });
    var visible = h('input', { type: 'checkbox', id: 'visible' }); visible.checked = p.visible !== false;
    var form = h('form', { class: 'card', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      [].forEach.call(form.querySelectorAll('.field'), function (f) { f.classList.remove('has-error'); });
      var v = function (id) { return form.querySelector('#' + id).value; };
      var body = { name: v('name'), district: v('district'), motherTongue: v('motherTongue'), religion: v('religion'), caste: v('caste'), about: v('about'), education: v('education'), occupation: v('occupation'), heightCm: v('heightCm'), maritalStatus: v('maritalStatus'), diet: v('diet'), visible: visible.checked, photos: photos };
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Saving...';
      api('PUT', '/api/profile', body).then(function () {
        status.className = 'msg ok'; status.textContent = 'Profile saved.'; status.hidden = false;
        return api('GET', '/api/me').then(function (j) { me = j.user; myProfile = j.profile; });
      }).catch(function (er) {
        var errs = er.body && er.body.errors;
        if (errs) Object.keys(errs).forEach(function (k) { var f = form.querySelector('#f-' + k), m = form.querySelector('#' + k + '-err'); if (f && m) { f.classList.add('has-error'); m.textContent = errs[k]; } });
        showErr(status, er);
      }).then(function () { btn.disabled = false; btn.textContent = 'Save profile'; status.focus && status.scrollIntoView({ block: 'nearest' }); });
    } },
      h('div', { class: 'grid2' }, input('name', 'Full name', u.name, { max: 60 }), select('district', 'District', DISTRICTS, u.district)),
      h('div', { class: 'grid2' }, select('motherTongue', 'Mother tongue', TONGUES, u.motherTongue), select('religion', 'Religion', RELIGIONS, u.religion)),
      h('div', { class: 'grid2' }, input('caste', 'Caste', u.caste, { max: 60 }), select('maritalStatus', 'Marital status', MARITAL, p.marital_status)),
      h('div', { class: 'grid2' }, input('education', 'Education', p.education, { max: 80 }), input('occupation', 'Occupation', p.occupation, { max: 80 })),
      h('div', { class: 'grid2' }, input('heightCm', 'Height (cm)', p.height_cm, { type: 'number', min: 120, maxv: 230, inputmode: 'numeric' }), select('diet', 'Diet', DIET, p.diet)),
      h('div', { class: 'field', id: 'f-about' }, h('label', { for: 'about', text: 'About me' }), h('textarea', { id: 'about', maxlength: '800' }, p.about || ''), h('p', { class: 'err', id: 'about-err' })),
      h('div', { class: 'field', id: 'f-photos' }, h('label', { for: 'photo', text: 'Photos (up to 3)' }), thumbs, file, photoErr, h('p', { class: 'muted', text: 'Photos are shrunk on your device before upload. Only members of the opposite gender can see your profile.' }), h('p', { class: 'err', id: 'photos-err' })),
      h('label', { class: 'checkline', for: 'visible' }, visible, 'Show my profile in search'),
      status, h('button', { class: 'btn', type: 'submit', style: 'margin-top:8px' }, 'Save profile'));
    view.appendChild(h('h1', { class: 'page-title', text: 'My profile' }));
    view.appendChild(h('p', { class: 'muted', style: 'margin-bottom:12px', text: 'Mobile: ' + u.mobile + ' (never shown to other members)' }));
    view.appendChild(form);
  }

  /* ---------- Router ---------- */
  function route() {
    var parts = (location.hash.replace(/^#\/?/, '') || 'discover').split('/');
    var r = parts[0];
    if (r === 'discover') discover();
    else if (r === 'view' && parts[1]) viewProfile(parts[1]);
    else if (r === 'interests') interests(parts[1]);
    else if (r === 'chat') chat(parts[1]);
    else if (r === 'me') myProfileView();
    else discover();
    window.scrollTo(0, 0);
  }

  document.getElementById('logout').addEventListener('click', function () {
    api('POST', '/api/logout', {}).catch(function () {}).then(function () { location.href = '/'; });
  });
  window.addEventListener('hashchange', route);

  if (location.protocol === 'file:') {
    clear(view);
    view.appendChild(h('p', { class: 'msg error', text: 'This page needs the server. Run: node dev-server.js, then open http://localhost:5173' }));
    return;
  }
  api('GET', '/api/me').then(function (j) {
    me = j.user; myProfile = j.profile;
    if (me.role === 'admin') document.getElementById('nav-admin').hidden = false;
    refreshBadge();
    // New members land on their profile first so others can see more than a name.
    if (!location.hash && !(myProfile && (myProfile.about || (myProfile.photos || []).length))) location.hash = '#/me';
    route();
  }).catch(function () {});
})();
