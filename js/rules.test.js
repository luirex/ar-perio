const fs = require('fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

const RULES = fs.readFileSync(require('path').join(__dirname, '..', 'firestore.rules'), 'utf8');
let pass = 0, fail = 0;

async function t(name, p, expectOk) {
  try {
    await (expectOk ? assertSucceeds(p) : assertFails(p));
    pass++; console.log('  ok   ' + name);
  } catch (e) {
    fail++; console.log('  FAIL ' + name + ' → ' + (e.message || e).toString().split('\n')[0]);
  }
}

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'arperio-test',
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });

  async function seed(requireLogin) {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('teachers/T1').set({ ok: true });
      await db.doc('links/A1').set({ studentId: 'sa-a1' });
      await db.doc('links/B2').set({ studentId: 'sa-b2' });
      await db.doc('students/sa-a1').set({ username: 'ana', name: 'Ana', at: 1, lastLogin: null });
      await db.doc('students/sa-b2').set({ username: 'beto', name: 'Beto', at: 2, lastLogin: null });
      await db.doc('usernames/ana').set({ email: 'sa-a1@arperio.app', sid: 'sa-a1' });
      await db.doc('shared/content__0').set({ key: 'content', i: 0, n: 1, ts: 1, data: '{}' });
      await db.doc('progress/student~sa-a1__0').set({ key: 'student:sa-a1', i: 0, n: 1, ts: 1, data: '{}', sid: 'sa-a1' });
      await db.doc('progress/student~sa-b2__0').set({ key: 'student:sa-b2', i: 0, n: 1, ts: 1, data: '{}', sid: 'sa-b2' });
      if (requireLogin !== null) await db.doc('public/config').set({ hasAccounts: true, requireLogin: !!requireLogin });
    });
  }

  const good = (sid, extra) => Object.assign({ key: 'student:' + sid, i: 0, n: 1, ts: 5, data: '{"a":1}', sid }, extra || {});

  /* ---------------- login NO obligatorio ---------------- */
  await seed(false);
  const guest = env.unauthenticatedContext().firestore();
  const stray = env.authenticatedContext('X9').firestore();       // con cuenta de Auth pero sin vínculo
  const A = env.authenticatedContext('A1').firestore();
  const T = env.authenticatedContext('T1').firestore();

  console.log('\nInvitado (sin sesión)');
  await t('lee shared', guest.collection('shared').get(), true);
  await t('lee public/config', guest.doc('public/config').get(), true);
  await t('get usernames/ana', guest.doc('usernames/ana').get(), true);
  await t('NO lista usernames', guest.collection('usernames').get(), false);
  await t('NO lee students', guest.doc('students/sa-a1').get(), false);
  await t('NO lista students', guest.collection('students').get(), false);
  await t('NO lee progress', guest.collection('progress').get(), false);
  await t('NO lee un progress concreto', guest.doc('progress/student~sa-a1__0').get(), false);
  await t('NO lee links', guest.doc('links/A1').get(), false);
  await t('NO lee teachers', guest.doc('teachers/T1').get(), false);
  await t('NO escribe shared', guest.doc('shared/content__0').set({ key: 'content', i: 0, n: 1, ts: 9, data: 'x' }), false);
  await t('NO escribe progress', guest.doc('progress/student~sa-a1__0').set(good('sa-a1')), false);
  await t('NO escribe public/config', guest.doc('public/config').set({ requireLogin: true }), false);
  await t('NO crea students', guest.doc('students/sa-z').set({ username: 'z' }), false);
  await t('NO crea links', guest.doc('links/Z').set({ studentId: 'sa-a1' }), false);
  await t('NO crea usernames', guest.doc('usernames/hack').set({ email: 'x@y.z', sid: 'sa-a1' }), false);
  await t('NO colección antigua kv', guest.collection('kv').get(), false);

  console.log('\nCuenta de Auth SIN vínculo (alguien que se registró solo)');
  await t('lee shared (público)', stray.collection('shared').get(), true);
  await t('NO lee progress', stray.collection('progress').get(), false);
  await t('NO lee students', stray.doc('students/sa-a1').get(), false);
  await t('NO escribe progress de sa-a1', stray.doc('progress/student~sa-a1__0').set(good('sa-a1')), false);
  await t('NO se vincula a sí misma', stray.doc('links/X9').set({ studentId: 'sa-a1' }), false);
  await t('NO se hace docente', stray.doc('teachers/X9').set({ ok: true }), false);

  console.log('\nEstudiante A (sa-a1)');
  await t('lee su ficha', A.doc('students/sa-a1').get(), true);
  await t('NO lee ficha de B', A.doc('students/sa-b2').get(), false);
  await t('NO lista students', A.collection('students').get(), false);
  await t('actualiza su lastLogin', A.doc('students/sa-a1').update({ lastLogin: 123 }), true);
  await t('NO cambia su nombre', A.doc('students/sa-a1').update({ name: 'Otro' }), false);
  await t('NO cambia su username', A.doc('students/sa-a1').update({ username: 'otro' }), false);
  await t('NO borra su ficha', A.doc('students/sa-a1').delete(), false);
  await t('lee SU progreso (consulta por sid)', A.collection('progress').where('sid', '==', 'sa-a1').get(), true);
  await t('NO lee TODO el progreso', A.collection('progress').get(), false);
  await t('NO consulta el progreso de B', A.collection('progress').where('sid', '==', 'sa-b2').get(), false);
  await t('NO lee doc de B', A.doc('progress/student~sa-b2__0').get(), false);
  await t('escribe su student', A.doc('progress/student~sa-a1__0').set(good('sa-a1')), true);
  await t('escribe su perio (nuevo trozo)', A.doc('progress/perio~sa-a1__1').set(good('sa-a1', { key: 'perio:sa-a1', i: 1, n: 2 })), true);
  await t('NO escribe progreso de B', A.doc('progress/student~sa-b2__0').set(good('sa-b2')), false);
  await t('NO pisa doc de B poniendo su sid', A.doc('progress/student~sa-b2__0').set(good('sa-a1')), false);
  await t('NO crea doc con sid ajeno', A.doc('progress/student~sa-a1__7').set(good('sa-b2')), false);
  await t('NO campo extra', A.doc('progress/student~sa-a1__0').set(good('sa-a1', { admin: true })), false);
  await t('NO key que no es suya', A.doc('progress/student~sa-a1__0').set(good('sa-a1', { key: 'content' })), false);
  await t('NO docId que no es suyo', A.doc('progress/otro__0').set(good('sa-a1')), false);
  await t('NO trozo gigante', A.doc('progress/student~sa-a1__0').set(good('sa-a1', { data: 'x'.repeat(300001) })), false);
  await t('trozo de 300000 caracteres sí', A.doc('progress/student~sa-a1__0').set(good('sa-a1', { data: 'x'.repeat(300000) })), true);
  await t('NO data que no es texto', A.doc('progress/student~sa-a1__0').set(good('sa-a1', { data: { a: 1 } })), false);
  await t('borra su trozo', A.doc('progress/perio~sa-a1__1').delete(), true);
  await t('NO borra progreso de B', A.doc('progress/student~sa-b2__0').delete(), false);
  await t('NO escribe shared', A.doc('shared/content__0').set({ key: 'content', i: 0, n: 1, ts: 9, data: 'x' }), false);
  await t('NO escribe public/config', A.doc('public/config').set({ requireLogin: true }), false);
  await t('NO crea cuentas', A.doc('students/sa-z').set({ username: 'z' }), false);
  await t('NO crea links', A.doc('links/Z').set({ studentId: 'sa-a1' }), false);
  await t('NO cambia su vínculo', A.doc('links/A1').set({ studentId: 'sa-b2' }), false);
  await t('NO lee teachers', A.doc('teachers/T1').get(), false);
  await t('lee su vínculo', A.doc('links/A1').get(), true);
  await t('NO lee el vínculo de B', A.doc('links/B2').get(), false);

  console.log('\nDocente');
  await t('lee todo el progreso', T.collection('progress').get(), true);
  await t('lista students', T.collection('students').get(), true);
  await t('consulta links por studentId', T.collection('links').where('studentId', '==', 'sa-a1').get(), true);
  await t('crea ficha', T.doc('students/sa-n1').set({ username: 'nuevo', name: 'N', at: 3, lastLogin: null }), true);
  await t('crea username', T.doc('usernames/nuevo').set({ email: 'sa-n1@arperio.app', sid: 'sa-n1' }), true);
  await t('crea vínculo', T.doc('links/N1').set({ studentId: 'sa-n1' }), true);
  await t('escribe shared', T.doc('shared/content__0').set({ key: 'content', i: 0, n: 1, ts: 9, data: 'x' }), true);
  await t('escribe public/config', T.doc('public/config').set({ hasAccounts: true, requireLogin: true }), true);
  await t('borra progreso de un estudiante', T.doc('progress/student~sa-b2__0').delete(), true);
  await t('lee su documento teachers', T.doc('teachers/T1').get(), true);
  await t('NO puede crear otros docentes desde la app', T.doc('teachers/otro').set({ ok: true }), false);

  /* ---------------- login obligatorio ---------------- */
  await seed(true);
  const guest2 = env.unauthenticatedContext().firestore();
  const stray2 = env.authenticatedContext('X9').firestore();
  const A2 = env.authenticatedContext('A1').firestore();
  const T2 = env.authenticatedContext('T1').firestore();
  console.log('\nLogin obligatorio ACTIVADO');
  await t('invitado NO lee shared', guest2.collection('shared').get(), false);
  await t('cuenta sin vínculo NO lee shared', stray2.collection('shared').get(), false);
  await t('estudiante lee shared', A2.collection('shared').get(), true);
  await t('docente lee shared', T2.collection('shared').get(), true);
  await t('invitado sí lee public/config (para mostrar el login)', guest2.doc('public/config').get(), true);

  /* ---------------- sin public/config todavía ---------------- */
  await seed(null);
  const guest3 = env.unauthenticatedContext().firestore();
  console.log('\nSin public/config (primer uso)');
  await t('invitado lee shared', guest3.collection('shared').get(), true);

  await env.cleanup();
  console.log(`\n${pass} correctas, ${fail} fallidas`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
