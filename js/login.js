/* AR PERIO — login.js · Puerta de acceso para estudiantes con cuenta.
 *
 * Si el docente ha creado cuentas de estudiante (usuario + contraseña), la
 * app muestra esta pantalla al abrirla y al cerrar sesión. Cada estudiante
 * entra con sus credenciales y su progreso queda separado del resto.
 * El modo invitado sigue disponible salvo que el docente lo desactive.
 */

/** ¿Hay que mostrar la puerta de login? (hay cuentas y nadie ha entrado) */
function loginGateNeeded() {
  if (Session.isTeacher()) return false;
  if (Session.data.studentId && Accounts.byId(Session.data.studentId)) return false;
  return Accounts.count() > 0;
}

function hideLoginGate() {
  const g = $("#login-gate");
  if (g) g.remove();
}

function maybeShowLoginGate() {
  if (!loginGateNeeded()) { hideLoginGate(); return false; }
  showLoginGate();
  return true;
}

function showLoginGate() {
  hideLoginGate();
  const list = Accounts.all();
  const requireLogin = !!Accounts.data.requireLogin;
  const gate = html(`<div class="login-gate" id="login-gate">
    <div class="lg-card">
      <div class="lg-brand">
        ${ARPerioLogoSVG()}
        <div><b>AR PERIO</b><span>Entrenamiento interactivo en Periodoncia</span></div>
      </div>
      <h2>Acceso del estudiante</h2>
      <p class="hint">Introduce el usuario y la contraseña que te dio tu docente.</p>
      ${list.length ? `
      <div class="lg-accounts" aria-label="Cuentas del curso">
        ${list.map((a) => `
        <button type="button" class="lg-acc" data-user="${esc(a.username)}" title="Elegir a ${esc(a.name)}">
          <span class="lg-acc-av">${esc((a.name || a.username).trim().charAt(0).toUpperCase())}</span>
          <span class="lg-acc-name">${esc(a.name)}</span>
          <span class="hint">@${esc(a.username)}</span>
        </button>`).join("")}
      </div>` : ""}
      <form id="lg-form" autocomplete="on">
        <label class="field"><span>${icon("user", 14)} Usuario</span>
          <input class="input" id="lg-user" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Tu usuario">
        </label>
        <label class="field"><span>${icon("lock", 14)} Contraseña</span>
          <input class="input" id="lg-pass" type="password" autocomplete="current-password" placeholder="Tu contraseña">
        </label>
        <p class="tl-error" id="lg-error"></p>
        <button class="btn primary block" type="submit">${icon("arrow-right", 15)} Entrar</button>
      </form>
      <div class="lg-foot">
        ${requireLogin
          ? `<p class="hint small">${icon("info", 13)} En este curso es obligatorio entrar con tu cuenta.</p>`
          : `<button type="button" class="lg-link" id="lg-guest">Continuar como invitado</button>`}
        <button type="button" class="lg-link" id="lg-teacher">${icon("graduation-cap", 13)} Soy docente</button>
      </div>
    </div>
  </div>`);
  document.body.appendChild(gate);

  const user = $("#lg-user", gate);
  const pass = $("#lg-pass", gate);
  const err = $("#lg-error", gate);

  // Selección rápida de cuenta → rellena el usuario y va a la contraseña
  gate.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-user]");
    if (pick) {
      user.value = pick.dataset.user;
      $$(".lg-acc", gate).forEach((b) => b.classList.toggle("picked", b === pick));
      err.textContent = "";
      pass.focus();
    }
  });

  $("#lg-form", gate).addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const submit = $("button[type=submit]", gate);
    submit.disabled = true;
    let acc = null;
    try {
      acc = await Accounts.verify(user.value, pass.value);
    } catch (ex) {
      // Fallo de red u otro problema que no es "contraseña incorrecta"
      err.textContent = (ex && ex.message) || "No se pudo conectar. Revisa tu internet e inténtalo de nuevo.";
      submit.disabled = false;
      return;
    }
    submit.disabled = false;
    if (!acc) {
      err.textContent = "Usuario o contraseña incorrectos. Inténtalo de nuevo.";
      pass.select();
      return;
    }
    // Trae de la nube el progreso de esta cuenta ANTES de entrar, para no
    // pisarlo con datos vacíos si es la primera vez en este dispositivo.
    if (window.FB) await FB.pull(["student:" + acc.id, "perio:" + acc.id]);
    // Cierra limpiamente la sesión de estudio del invitado (si la había)
    Student.endSession();
    Session.studentLogin(acc);
    hideLoginGate();
    App.render();
    toast({ title: `¡Hola, ${acc.name}!`, description: "Sesión iniciada. Tu progreso quedará guardado en tu cuenta." });
  });

  const guest = $("#lg-guest", gate);
  if (guest) guest.addEventListener("click", () => {
    hideLoginGate();
    App.render();
    toast({ title: "Modo invitado", description: "El progreso se guardará en este navegador sin cuenta." });
  });

  $("#lg-teacher", gate).addEventListener("click", () => {
    if (window.FB && FB.enabled) { showTeacherLogin(); return; }   // con Firebase: correo + contraseña
    hideLoginGate();
    App.setModule("docente");
  });

  (list.length ? pass : user).focus();
}

/** Acceso del docente con Firebase: correo + contraseña de su cuenta (registrada como docente). */
function showTeacherLogin() {
  hideLoginGate();
  const gate = html(`<div class="login-gate" id="login-gate">
    <div class="lg-card">
      <div class="lg-brand">
        ${ARPerioLogoSVG()}
        <div><b>AR PERIO</b><span>Entrenamiento interactivo en Periodoncia</span></div>
      </div>
      <h2>Acceso del docente</h2>
      <p class="hint">Entra con el correo y la contraseña de tu cuenta de docente.</p>
      <form id="tg-form" autocomplete="on">
        <label class="field"><span>${icon("user", 14)} Correo</span>
          <input class="input" id="tg-email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="tu.correo@institucion.edu">
        </label>
        <label class="field"><span>${icon("lock", 14)} Contraseña</span>
          <input class="input" id="tg-pass" type="password" autocomplete="current-password" placeholder="Tu contraseña">
        </label>
        <p class="tl-error" id="tg-error"></p>
        <button class="btn primary block" type="submit">${icon("arrow-right", 15)} Entrar</button>
      </form>
      <div class="lg-foot">
        <button type="button" class="lg-link" id="tg-reset">¿Olvidaste tu contraseña?</button>
        <button type="button" class="lg-link" id="tg-back">Volver</button>
      </div>
    </div>
  </div>`);
  document.body.appendChild(gate);

  const email = $("#tg-email", gate);
  const pass = $("#tg-pass", gate);
  const err = $("#tg-error", gate);

  $("#tg-form", gate).addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const submit = $("button[type=submit]", gate);
    submit.disabled = true;
    const r = await FB.teacherSignIn(email.value, pass.value);
    submit.disabled = false;
    if (r.error) {
      err.textContent = r.error;
      pass.select();
      return;
    }
    Student.endSession();
    Session.teacherLogin();
    hideLoginGate();
    App.setModule("docente");
    toast({ title: "Sesión de docente iniciada", description: "Tus cambios se guardan en la nube." });
  });

  $("#tg-reset", gate).addEventListener("click", async () => {
    err.textContent = "";
    if (!email.value.trim()) { err.textContent = "Escribe tu correo y vuelve a pulsar el enlace."; email.focus(); return; }
    const r = await FB.sendReset(email.value);
    if (r.error) { err.textContent = r.error; return; }
    toast({ title: "Correo enviado", description: "Revisa tu bandeja para restablecer la contraseña." });
  });

  $("#tg-back", gate).addEventListener("click", () => {
    hideLoginGate();
    if (!maybeShowLoginGate()) App.render();
  });

  email.focus();
}
