(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function api(method, url, body) {
    return fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401) { location.href = '/#register'; throw new Error('login'); }
          if (!r.ok) throw new Error(j.error || 'Error');
          return j;
        });
      });
  }
  function td(text) { var c = document.createElement('td'); c.textContent = text == null ? '' : String(text); return c; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function date(s) { try { return new Date(s).toLocaleDateString([], { dateStyle: 'medium' }); } catch (e) { return ''; } }

  function loadAll() {
    api('GET', '/api/admin/stats').then(function (s) {
      $('content').hidden = false;
      var box = $('stats'); clear(box);
      [['Registered', s.total], ['Verified', s.verified], ['Last 24 hours', s.today], ['Reports', s.reports], ['Men', s.male], ['Women', s.female], ['Blocked', s.blocked]].forEach(function (x) {
        var d = document.createElement('div'); d.className = 'stat';
        var b = document.createElement('b'); b.textContent = String(x[1]);
        d.appendChild(b); d.appendChild(document.createTextNode(x[0])); box.appendChild(d);
      });
      return api('GET', '/api/admin/users');
    }).then(function (j) {
      var tb = $('users'); clear(tb);
      j.users.forEach(function (u) {
        var tr = document.createElement('tr');
        [u.name, u.mobile, u.gender, u.age, u.district, u.verified ? 'Yes' : 'No', u.status + (u.role === 'admin' ? ' (admin)' : ''), date(u.createdAt)].forEach(function (v) { tr.appendChild(td(v)); });
        var c = document.createElement('td');
        if (u.role !== 'admin') {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ' + (u.status === 'blocked' ? '' : 'ghost');
          b.textContent = u.status === 'blocked' ? 'Unblock' : 'Block';
          b.addEventListener('click', function () {
            if (u.status !== 'blocked' && !confirm('Block ' + u.name + '? They will be logged out and hidden from search.')) return;
            api('POST', '/api/admin/users/' + u.id + '/status', { status: u.status === 'blocked' ? 'active' : 'blocked' }).then(loadAll).catch(function (e) { alert(e.message); });
          });
          c.appendChild(b);
        }
        tr.appendChild(c); tb.appendChild(tr);
      });
      return api('GET', '/api/admin/reports');
    }).then(function (j) {
      var tb = $('reports'); clear(tb);
      if (!j.reports.length) { var tr0 = document.createElement('tr'); tr0.appendChild(td('No reports.')); tb.appendChild(tr0); }
      j.reports.forEach(function (r) {
        var tr = document.createElement('tr');
        [date(r.at), r.target ? r.target.name + ' (' + r.target.status + ')' : 'deleted', r.reporter, r.reason].forEach(function (v) { tr.appendChild(td(v)); });
        tb.appendChild(tr);
      });
    }).catch(function (e) {
      if (e.message === 'login') return;
      var d = $('denied'); d.textContent = e.message === 'Admins only.' ? 'This page is for administrators only.' : e.message; d.hidden = false;
    });
  }
  $('logout').addEventListener('click', function () { api('POST', '/api/logout', {}).catch(function () {}).then(function () { location.href = '/'; }); });
  loadAll();
})();
