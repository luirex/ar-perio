/* ============================================================
   AR PERIO · Firebase seguro (Auth correo/contraseña + Firestore con reglas)

   Identidad
     · Docente    → cuenta de Auth + documento teachers/{uid} (creado a mano en la consola)
     · Estudiante → cuenta de Auth interna (sa-xxxx@arperio.app) que el docente crea;
                    el documento links/{uid} la une a su studentId. El estudiante escribe
                    su "usuario" y su contraseña; el correo interno nunca se le muestra.
     · Invitado   → sin sesión: solo puede leer el contenido compartido.
   La autorización la imponen las reglas de firestore.rules, no este archivo.

   Datos (localStorage sigue siendo lo que lee la app; esta capa lo espeja)
     shared/*    content · radiobank              (escribe solo el docente)
     progress/*  student:<id> · perio:<id>        (escribe solo su dueño; lee el docente)
     students/*  fichas de cuenta (docente)       usernames/* · links/* · public/config

   Si Firebase no está configurado o no carga, la app sigue en modo local.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.FIREBASE_CONFIG || {};
  var configured = !!cfg.apiKey && cfg.apiKey !== 'REEMPLAZAR' &&
                   !!cfg.projectId && cfg.projectId !== 'REEMPLAZAR';

  var FB = { enabled: false, synced: false, role: null, sid: null, user: null };
  window.FB = FB;

  var noop = function () {};
  FB.push = noop;
  FB.start = noop;
  FB.pull = FB.logout = function () { return Promise.resolve(); };

  if (!window.firebase || !configured) {
    console.info('[FB] Firebase no configurado: modo local (localStorage).');
    return;
  }

  firebase.initializeApp(cfg);
  FB.auth = firebase.auth();
  FB.db = firebase.firestore();
  FB.enabled = true;

  FB.db.enablePersistence({ synchronizeTabs: true }).catch(function (e) {
    console.warn('[FB] Persistencia offline no disponible:', e.code);
  });

  var PREFIX = 'arperio:';
  var META = 'arperio_meta:';
  var ROLE_KEY = 'arperio_role';
  var CHUNK = 300000;
  var SHARED_KEYS = { content: 1, radiobank: 1 };
  var CRED_ERR = /invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/;

  var db = function (c) { return FB.db.collection(c); };
  var warn = function (what) { return function (e) { console.warn('[FB] ' + what, e && (e.code || e)); }; };

  function collectionOf(key) {
    if (SHARED_KEYS[key]) return 'shared';
    if (/^(student|perio):[^:]+$/.test(key)) return 'progress';
    return null;                                   // settings, session, student, perio… quedan locales
  }
  function canWrite(key) {
    var c = collectionOf(key);
    if (c === 'shared') return FB.role === 'teacher';
    if (c === 'progress') return FB.role === 'student' && !!FB.sid && key.split(':')[1] === FB.sid;
    return false;
  }
  function getMeta(key) { return +localStorage.getItem(META + key) || 0; }
  function setMeta(key, ts) { try { localStorage.setItem(META + key, String(ts)); } catch (e) {} }
  function docId(key, i) { return key.replace(/:/g, '~') + '__' + i; }

  function chunks(s) {
    var out = [], pos = 0;
    if (!s.length) return [''];
    while (pos < s.length) {
      var end = Math.min(pos + CHUNK, s.length);
      var c = s.charCodeAt(end - 1);
      if (end < s.length && c >= 0xD800 && c <= 0xDBFF) end--;   // no partir pares sustitutos
      out.push(s.slice(pos, end));
      pos = end;
    }
    return out;
  }

  function authMsg(e) {
    var c = (e && e.code) || '';
    if (/weak-password/.test(c)) return 'La contraseña debe tener al menos 6 caracteres.';
    if (/email-already-in-use/.test(c)) return 'Ese usuario ya existe. Elige otro.';
    if (/too-many-requests/.test(c)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    if (/network/.test(c)) return 'Sin conexión con Firebase. Revisa tu internet.';
    if (CRED_ERR.test(c)) return 'Correo o contraseña incorrectos.';
    if (/permission-denied/.test(c)) return 'Sin permiso. Revisa que las reglas estén publicadas y que tu cuenta de docente esté registrada.';
    return (e && e.message) || 'Error inesperado.';
  }

  /* ============================ Rol de la sesión ============================ */

  function applyRole(role, sid, uid) {
    FB.role = role; FB.sid = sid || null; FB._uid = uid || null;
    try {
      if (role) localStorage.setItem(ROLE_KEY, JSON.stringify({ uid: uid, role: role, sid: sid || null }));
      else localStorage.removeItem(ROLE_KEY);
    } catch (e) {}
  }
  function cachedRole(uid) {
    try { var r = JSON.parse(localStorage.getItem(ROLE_KEY) || 'null'); return r && r.uid === uid ? r : null; }
    catch (e) { return null; }
  }

  // Rol real = lo que dicen las reglas: teachers/{uid} → docente; links/{uid} → estudiante.
  // Si no hay red se usa el último rol conocido de este mismo uid.
  function resolveRole(user) {
    var c = cachedRole(user.uid);
    if (c) applyRole(c.role, c.sid, user.uid);
    return Promise.all([db('teachers').doc(user.uid).get(), db('links').doc(user.uid).get()])
      .then(function (r) {
        if (r[0].exists) applyRole('teacher', null, user.uid);
        else if (r[1].exists) applyRole('student', r[1].data().studentId, user.uid);
        else applyRole(null, null, user.uid);
      })
      .catch(warn('No se pudo comprobar el rol (se usa el último conocido)'));
  }

  /* ============================ Escritura (local → nube) ============================ */

  var timers = {}, pending = {}, remote = {}, remoteN = {};

  FB.push = function (key, json) {
    try {
      if (!canWrite(key)) return;
      var ts = Date.now();
      setMeta(key, ts);
      pending[key] = { json: json, ts: ts };
      clearTimeout(timers[key]);
      timers[key] = setTimeout(function () { flushKey(key); }, 800);
    } catch (e) { console.warn('[FB] push', e); }
  };

  function flushKey(key) {
    clearTimeout(timers[key]); delete timers[key];
    var p = pending[key];
    if (!p) return Promise.resolve();
    delete pending[key];
    return write(key, p.json, p.ts);
  }
  function flushAll() {
    var jobs = Object.keys(pending).map(flushKey);
    return Promise.race([Promise.all(jobs), new Promise(function (res) { setTimeout(res, 3000); })]);
  }

  function write(key, json, ts) {
    var c = collectionOf(key), col = db(c), parts = chunks(json), n = parts.length;
    var sid = c === 'progress' ? key.split(':')[1] : null;
    return Promise.all(parts.map(function (data, i) {
      var d = { key: key, i: i, n: n, ts: ts, data: data };
      if (sid) d.sid = sid;
      return col.doc(docId(key, i)).set(d);
    })).then(function () {
      var old = remoteN[key] || 0, dels = [];
      for (var j = n; j < old; j++) dels.push(col.doc(docId(key, j)).delete());
      remoteN[key] = n;
      return Promise.all(dels);
    }).catch(warn('No se pudo sincronizar ' + key));
  }

  /* ============================ Lectura (nube → local) ============================ */

  function assemble(key) {
    var parts = remote[key];
    if (!parts) return null;
    var maxTs = -1, ref = null, i;
    for (i in parts) if (parts[i].ts > maxTs) { maxTs = parts[i].ts; ref = parts[i]; }
    if (!ref) return null;
    var out = [];
    for (var k = 0; k < ref.n; k++) {
      var p = parts[k];
      if (!p || p.ts !== ref.ts || p.n !== ref.n) return null;   // escritura incompleta: esperar
      out.push(p.data);
    }
    remoteN[key] = ref.n;
    return { ts: ref.ts, data: out.join('') };
  }

  var changedFirst = false;

  function applyRemote(key) {
    var r = assemble(key);
    if (!r || r.ts <= getMeta(key)) return;
    try { JSON.parse(r.data); } catch (e) { return; }
    try {
      localStorage.setItem(PREFIX + key, r.data);
      setMeta(key, r.ts);
    } catch (e) { console.warn('[FB] Almacenamiento local lleno al recibir', key); return; }
    changedFirst = true;
    refreshModel(key);
  }

  function refreshModel(key) {
    try {
      if (key === 'content') { Content.reload(); Bus.emit('content'); }
      else if (key === 'radiobank') { RadioBank.reload(); Bus.emit('radiobank'); }
      else {
        var id = key.split(':')[1];
        if (Session.data && Session.data.studentId === id) StudentScope.apply();
        else Bus.emit('student');
      }
    } catch (e) { console.error('[FB] refresh', key, e); }
  }

  function onDocs(snap) {
    var touched = {};
    snap.docChanges().forEach(function (ch) {
      var d = ch.doc.data();
      remote[d.key] = remote[d.key] || {};
      if (ch.type === 'removed') delete remote[d.key][d.i]; else remote[d.key][d.i] = d;
      touched[d.key] = 1;
    });
    Object.keys(touched).forEach(applyRemote);
  }

  // Sube lo local que es más nuevo (o que aún no existe en la nube)
  function reconcile(colName) {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) keys.push(k.slice(PREFIX.length));
    }
    keys.forEach(function (key) {
      if (collectionOf(key) !== colName || !canWrite(key)) return;
      var r = assemble(key);
      if (!r || getMeta(key) > r.ts) FB.push(key, localStorage.getItem(PREFIX + key));
    });
  }

  /* ============================ Cuentas (vista del docente) ============================ */

  function applyStudents(snap) {
    var list = snap.docs.map(function (d) {
      var x = d.data();
      return { id: d.id, username: x.username, name: x.name, at: x.at || 0, lastLogin: x.lastLogin || null };
    }).sort(function (a, b) { return a.at - b.at; });
    try {
      // Respaldo único de las cuentas locales anteriores a Firebase (llevan contraseña local)
      if (!localStorage.getItem('arperio_legacy_accounts') && Accounts.all().some(function (a) { return a.passHash; })) {
        localStorage.setItem('arperio_legacy_accounts', JSON.stringify(Accounts.all()));
      }
      if (JSON.stringify(Accounts.data.list) !== JSON.stringify(list)) {
        Accounts.data.list = list;
        Accounts.save();
      }
    } catch (e) { console.error('[FB] students', e); }
  }

  function applyConfig(c) {
    var h = !!c.hasAccounts, r = !!c.requireLogin, changed = false;
    if (Accounts.data.hasAccounts !== h) { Accounts.data.hasAccounts = h; changed = true; }
    if (Accounts.data.requireLogin !== r) { Accounts.data.requireLogin = r; changed = true; }
    if (!changed) return;
    Accounts.save();
    if (FB.synced && typeof maybeShowLoginGate === 'function') maybeShowLoginGate();
  }

  /* ============================ Suscripciones ============================ */

  var subs = [], sig = '', firstPending = { config: 1, shared: 1 };

  function whenLoaded(fn) {
    if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn);
  }
  function afterFirstSync() {
    whenLoaded(function () {
      try {
        if (changedFirst && typeof App !== 'undefined' && App.render) App.render();
        if (typeof maybeShowLoginGate === 'function') maybeShowLoginGate();
      } catch (e) { console.error(e); }
    });
  }
  function firstDone(name) {
    if (!firstPending[name]) return;
    delete firstPending[name];
    if (!Object.keys(firstPending).length) { FB.synced = true; afterFirstSync(); }
  }

  function listen(q, colName) {
    var reconciled = false;
    subs.push(q.onSnapshot({ includeMetadataChanges: true }, function (snap) {
      onDocs(snap);
      if (!snap.metadata.fromCache && !reconciled) { reconciled = true; reconcile(colName); }
      if (colName === 'shared') firstDone('shared');
    }, function (e) {
      console.warn('[FB] Escucha de ' + colName + ':', e && (e.code || e));
      if (colName === 'shared') firstDone('shared');
    }));
  }

  function subscribe() {
    var s = (FB.role || 'invitado') + '|' + (FB.sid || '');
    if (s === sig) return;
    sig = s;
    subs.forEach(function (f) { try { f(); } catch (e) {} });
    subs = [];
    Object.keys(remote).forEach(function (k) { if (collectionOf(k) === 'progress') delete remote[k]; });

    listen(db('shared'), 'shared');
    if (FB.role === 'teacher') {
      listen(db('progress'), 'progress');
      subs.push(db('students').onSnapshot(applyStudents, warn('Escucha de cuentas')));
    } else if (FB.role === 'student' && FB.sid) {
      listen(db('progress').where('sid', '==', FB.sid), 'progress');
    }
  }

  /* Coherencia entre la sesión guardada en localStorage (que cualquiera puede editar)
   * y la identidad real de Firebase. Solo al arrancar. */
  function bootCheckSession() {
    try {
      var changed = false;
      if (Session.isTeacher() && FB.role !== 'teacher') {
        Session.data = { role: 'student', since: null, studentId: null }; changed = true;
      } else if (Session.data.studentId && !(FB.role === 'student' && FB.sid === Session.data.studentId)) {
        Session.data = { role: 'student', since: null, studentId: null }; changed = true;
      } else if (FB.role === 'teacher' && !Session.isTeacher()) {
        Session.data = { role: 'teacher', since: Date.now(), studentId: null }; changed = true;
      }
      if (FB.role !== 'teacher') {
        // En un dispositivo de estudiante solo existe su propia cuenta (nunca la lista del curso)
        var own = FB.role === 'student' ? Accounts.all().filter(function (a) { return a.id === FB.sid; }) : [];
        if (own.length !== Accounts.all().length) { Accounts.data.list = own; Accounts.save(); changed = true; }
      }
      if (changed) {
        Session.save();
        if (FB.role !== 'student') purgeLocal();
        StudentScope.apply();
        whenLoaded(function () { if (typeof App !== 'undefined' && App.render) App.render(); });
      }
    } catch (e) { console.error('[FB] bootCheck', e); }
  }

  FB.start = function () {
    var booted = false;
    FB.auth.onAuthStateChanged(function (user) {
      FB.user = user || null;
      var done;
      if (!user) { applyRole(null); done = Promise.resolve(); }
      else if (FB._uid === user.uid && FB.role) done = Promise.resolve();   // inicio de sesión propio ya resuelto
      else done = resolveRole(user);
      done.then(function () {
        if (!booted) { booted = true; bootCheckSession(); }
        subscribe();
      });
    });
    db('public').doc('config').onSnapshot(function (s) {
      applyConfig(s.exists ? s.data() : {});
      firstDone('config');
    }, function (e) { console.warn('[FB] Configuración pública:', e && e.code); firstDone('config'); });
  };

  /* ============================ Acceso: docente y estudiante ============================ */

  FB.teacherSignIn = function (email, pass) {
    return FB.auth.signInWithEmailAndPassword(String(email || '').trim(), String(pass || ''))
      .then(function (cred) {
        var uid = cred.user.uid;
        return db('teachers').doc(uid).get().then(function (s) {
          if (!s.exists) {
            return FB.auth.signOut().then(function () { return { error: 'Esta cuenta no tiene permisos de docente.' }; });
          }
          applyRole('teacher', null, uid);
          // Primer uso: crea la configuración pública
          db('public').doc('config').get().then(function (c) {
            if (!c.exists) return db('public').doc('config').set({ hasAccounts: false, requireLogin: false });
          }).catch(noop);
          return { ok: true };
        });
      })
      .catch(function (e) { return { error: authMsg(e) }; });
  };

  FB.sendReset = function (email) {
    return FB.auth.sendPasswordResetEmail(String(email || '').trim())
      .then(function () { return { ok: true }; })
      .catch(function (e) { return { error: authMsg(e) }; });
  };

  // Devuelve { id, username, name, at, lastLogin } o null si las credenciales no valen.
  // Lanza un Error si el problema es de red u otro (para distinguirlo de "contraseña incorrecta").
  FB.studentLogin = function (username, password) {
    var key = String(username || '').trim().toLowerCase();
    if (!key || !password) return Promise.resolve(null);
    return db('usernames').doc(key).get().then(function (u) {
      if (!u.exists) return null;
      var sid = u.data().sid;
      return FB.auth.signInWithEmailAndPassword(u.data().email, String(password)).then(function (cred) {
        var uid = cred.user.uid;
        return Promise.all([db('links').doc(uid).get(), db('students').doc(sid).get()]).then(function (r) {
          if (!r[0].exists || r[0].data().studentId !== sid || !r[1].exists) {
            return FB.auth.signOut().then(function () { return null; });
          }
          applyRole('student', sid, uid);
          var d = r[1].data(), now = Date.now();
          db('students').doc(sid).update({ lastLogin: now }).catch(noop);
          return { id: sid, username: d.username, name: d.name, at: d.at || now, lastLogin: now };
        });
      });
    }).catch(function (e) {
      if (CRED_ERR.test((e && e.code) || '')) return null;
      throw new Error(authMsg(e));
    });
  };

  // Trae el progreso de la cuenta ya autenticada (antes de entrar a la app) para no pisarlo con datos vacíos
  FB.pull = function () {
    if (FB.role !== 'student' || !FB.sid) return Promise.resolve();
    var job = db('progress').where('sid', '==', FB.sid).get().then(function (snap) {
      var touched = {};
      snap.docs.forEach(function (doc) {
        var d = doc.data();
        remote[d.key] = remote[d.key] || {};
        remote[d.key][d.i] = d;
        touched[d.key] = 1;
      });
      Object.keys(touched).forEach(applyRemote);
    }).catch(warn('pull'));
    return Promise.race([job, new Promise(function (res) { setTimeout(res, 4000); })]);
  };

  /* Cierra sesión: envía lo pendiente, borra de este dispositivo el progreso y las cuentas
   * (siguen en la nube) y cierra la sesión de Firebase. */
  function purgeLocal() {
    try {
      var rm = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (/^arperio:(student|perio):/.test(k) || /^arperio_meta:(student|perio):/.test(k))) rm.push(k);
      }
      rm.forEach(function (k) { localStorage.removeItem(k); });
      localStorage.removeItem(ROLE_KEY);
      if (Accounts.all().length) { Accounts.data.list = []; Accounts.save(); }
    } catch (e) { console.warn('[FB] purge', e); }
  }
  FB.logout = function () {
    return flushAll().then(function () {
      purgeLocal();
      return FB.auth.signOut();
    }).catch(warn('logout'));
  };

  /* ============================ Gestión de cuentas (docente) ============================ */

  function auxAuth() {
    var app;
    try { app = firebase.app('aux'); } catch (e) { app = firebase.initializeApp(cfg, 'aux'); }
    return app.auth();
  }
  // Crea el usuario de Auth en una app secundaria para no cerrar la sesión del docente
  function createAuthUser(email, pass) {
    var a = auxAuth();
    return a.setPersistence(firebase.auth.Auth.Persistence.NONE)
      .then(function () { return a.createUserWithEmailAndPassword(email, pass); })
      .then(function (cred) { var uid = cred.user.uid; return a.signOut().then(function () { return uid; }); });
  }
  var needTeacher = function () { return Promise.resolve({ error: 'Solo el docente con sesión iniciada puede hacer esto.' }); };

  FB.createStudent = function (p) {
    if (FB.role !== 'teacher') return needTeacher();
    var key = p.username.toLowerCase();
    return db('usernames').doc(key).get().then(function (s) {
      if (s.exists) return { error: 'Ese usuario ya existe. Elige otro.' };
      var sid = 'sa-' + rid(), email = sid + '@arperio.app', now = Date.now();
      return createAuthUser(email, p.password).then(function (uid) {
        var b = FB.db.batch();
        b.set(db('students').doc(sid), { username: p.username, name: p.name, authEmail: email, at: now, lastLogin: null });
        b.set(db('usernames').doc(key), { email: email, sid: sid });
        b.set(db('links').doc(uid), { studentId: sid });
        b.set(db('public').doc('config'), { hasAccounts: true }, { merge: true });
        return b.commit().then(function () {
          return { acc: { id: sid, username: p.username, name: p.name, at: now, lastLogin: null } };
        });
      });
    }).catch(function (e) { return { error: authMsg(e) }; });
  };

  // Firebase no deja cambiar la contraseña de otro usuario desde el navegador:
  // se crea un acceso nuevo para la misma ficha y se revoca el anterior (el progreso se conserva).
  FB.resetStudentPassword = function (acc, password) {
    if (FB.role !== 'teacher') return needTeacher();
    var email = acc.id + '-' + rid() + '@arperio.app';
    return createAuthUser(email, password).then(function (uid) {
      return db('links').where('studentId', '==', acc.id).get().then(function (snap) {
        var b = FB.db.batch();
        snap.docs.forEach(function (d) { b.delete(d.ref); });
        b.set(db('links').doc(uid), { studentId: acc.id });
        b.update(db('students').doc(acc.id), { authEmail: email });
        b.set(db('usernames').doc(acc.username.toLowerCase()), { email: email, sid: acc.id });
        return b.commit();
      });
    }).then(function () { return { ok: true }; })
      .catch(function (e) { return { error: authMsg(e) }; });
  };

  FB.updateStudent = function (id, patch) {
    if (FB.role !== 'teacher') return Promise.resolve();
    return db('students').doc(id).update(patch).catch(warn('updateStudent'));
  };

  FB.setPublicConfig = function (patch) {
    if (FB.role !== 'teacher') return Promise.resolve();
    return db('public').doc('config').set(patch, { merge: true }).catch(warn('setPublicConfig'));
  };

  FB.deleteStudent = function (acc) {
    if (FB.role !== 'teacher') return Promise.resolve();
    var sid = acc.id;
    return Promise.all([
      db('links').where('studentId', '==', sid).get(),
      db('progress').where('sid', '==', sid).get(),
    ]).then(function (r) {
      var refs = [];
      r[0].docs.forEach(function (d) { refs.push(d.ref); });
      r[1].docs.forEach(function (d) { refs.push(d.ref); });
      refs.push(db('students').doc(sid), db('usernames').doc(acc.username.toLowerCase()));
      var jobs = [];
      for (var i = 0; i < refs.length; i += 400) {
        var b = FB.db.batch();
        refs.slice(i, i + 400).forEach(function (ref) { b.delete(ref); });
        jobs.push(b.commit());
      }
      return Promise.all(jobs);
    }).then(function () {
      return db('students').limit(1).get();
    }).then(function (s) {
      return FB.setPublicConfig({ hasAccounts: !s.empty });
    }).catch(warn('deleteStudent'));
  };
})();
