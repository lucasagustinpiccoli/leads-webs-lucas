// GymFlow (demo) — socios, vender/renovar membresía, pagos, caja, calendario y dashboard.
// Sin build y sin backend: se sube tal cual (index.html + style.css + demo-backend.js + este archivo).
// demo-backend.js simula la base de datos en memoria; no hay login.

const sb = window.crearClienteDemo();

let staffActual = null; // { id, tenant_id, nombre, rol }
let planesCache = [];
let sociosCache = []; // último resultado de v_estado_socios, para filtrar sin recargar

const $ = (id) => document.getElementById(id);

function mostrarError(elId, err) {
  $(elId).textContent = err?.message || String(err) || 'Ocurrió un error.';
}

function abrirModal(id) { $(id).hidden = false; }
function cerrarModal(id) { $(id).hidden = true; }
document.querySelectorAll('[data-cerrar]').forEach((btn) => {
  btn.addEventListener('click', () => cerrarModal(btn.dataset.cerrar));
});

// ============================================================
// Modo claro/oscuro — el tema ya se aplicó al cargar (ver el script
// inline en el <head>, evita el flash del tema por defecto). Este
// listener solo maneja el toggle y lo recuerda para la próxima visita.
// ============================================================
$('btn-tema').addEventListener('click', () => {
  const actual = document.documentElement.getAttribute('data-theme');
  const nuevo = actual === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nuevo);
  try { localStorage.setItem('gymflow-tema', nuevo); } catch (e) {}
});

// ============================================================
// Navegación (navbar + menú mobile)
// ============================================================
function irAVista(nombre) {
  document.querySelectorAll('.vista').forEach((sec) => { sec.hidden = sec.id !== `vista-${nombre}`; });
  document.querySelectorAll('.navbar-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.vista === nombre);
  });
  cerrarMenuMovil();
  if (nombre === 'caja') {
    mostrarCaja();
  } else {
    // Se re-bloquea al cambiar de vista, tal como se pidió.
    cajaDesbloqueada = false;
  }
  if (nombre === 'calendario') cargarTurnos();
  if (nombre === 'dashboard') cargarDashboard();
  posicionarIndicador();
}
document.querySelectorAll('.navbar-tab').forEach((tab) => {
  tab.addEventListener('click', () => irAVista(tab.dataset.vista));
});

// ---- Detalles de interfaz: avatar de color, números que cuentan y el indicador deslizante del menú ----
function colorAvatar(nombre) {
  let h = 0;
  for (const c of String(nombre)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function avatarHTML(nombre) {
  const ini = String(nombre).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return `<span class="avatar" style="--h:${colorAvatar(nombre)}" aria-hidden="true">${ini}</span>`;
}
// Cuenta de 0 al valor que tiene el elemento (conserva el formato: $ y puntos de miles).
function contar(el) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const texto = el.textContent;
  const m = texto.match(/-?[\d.]+/);
  if (!m) return;
  const destino = parseInt(m[0].replace(/\./g, ''), 10);
  if (!Number.isFinite(destino) || destino === 0) return;
  const t0 = performance.now(), dur = 900;
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = texto.replace(m[0], Math.round(destino * e).toLocaleString('es-AR'));
    if (k < 1) requestAnimationFrame(paso); else el.textContent = texto;
  };
  requestAnimationFrame(paso);
}
function posicionarIndicador() {
  const nav = $('navbar-tabs'), ind = nav && nav.querySelector('.navbar-indicador'), act = nav && nav.querySelector('.navbar-tab.is-active');
  if (!ind || !act || !act.offsetWidth) return;
  ind.style.width = act.offsetWidth + 'px';
  ind.style.transform = `translateX(${act.offsetLeft}px)`;
  ind.classList.add('listo');
}
window.addEventListener('resize', posicionarIndicador);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(posicionarIndicador);

function cerrarMenuMovil() {
  $('navbar-menu-movil').classList.remove('is-abierto');
  $('btn-menu-movil').classList.remove('is-abierto');
  $('btn-menu-movil').setAttribute('aria-expanded', 'false');
}
$('btn-menu-movil').addEventListener('click', () => {
  const abierto = $('navbar-menu-movil').classList.toggle('is-abierto');
  $('btn-menu-movil').classList.toggle('is-abierto', abierto);
  $('btn-menu-movil').setAttribute('aria-expanded', String(abierto));
});

function formatoMoneda(n) {
  if (n === null || n === undefined) return '—';
  return '$' + Number(n).toLocaleString('es-AR');
}

const TEXTOS_ESTADO = { activo: 'Activo', por_vencer: 'Por vencer', vencido: 'Vencido', inactivo: 'Inactivo' };
function etiquetaEstado(estado) {
  return `<span class="pill ${estado}">${TEXTOS_ESTADO[estado] || estado}</span>`;
}
function etiquetaEstadoTexto(estado) {
  return TEXTOS_ESTADO[estado] || estado;
}

// Contador de clases consumidas — solo para planes por paquete (8 CLASES).
// Stepper libre: +1 suma una clase, -1 resta la última (para corregir un
// toque de más), sin la restricción de "una por día" que tenía el tilde
// original.
function pillClase(s) {
  if (s.cantidad_turnos == null) return '';
  const consumidas = s.clases_consumidas ?? 0;
  const agotado = s.clases_restantes <= 0;
  const clase = ['pill-clase', agotado ? 'agotado' : ''].filter(Boolean).join(' ');
  return `
    <span class="${clase}">
      <button type="button" class="pill-clase-btn btn-clase-menos" title="Restar una clase" ${consumidas <= 0 ? 'disabled' : ''}>−</button>
      <span class="pill-clase-valor">${consumidas}/${s.cantidad_turnos}</span>
      <button type="button" class="pill-clase-btn btn-clase-mas" title="Sumar una clase">+</button>
    </span>
  `;
}

// A diferencia del resto de las acciones (que recargan toda la tabla), esta
// se toca muchas veces por día — recargar de cero mostraría el esqueleto de
// carga en cada click. El RPC ya devuelve el conteo actualizado, así que
// alcanza con parchear el objeto en cache (misma referencia que usa
// sociosCache) y volver a pintar sin ir de nuevo al servidor.
async function ajustarAsistenciaClase(botones, socio, delta) {
  botones.forEach((b) => (b.disabled = true));
  const { data, error } = await sb.rpc('fn_ajustar_asistencia_clase', {
    p_socio_id: socio.socio_id,
    p_delta: delta,
    p_registrado_por: staffActual.id,
  });
  botones.forEach((b) => (b.disabled = false));
  if (error) return console.error(error.message);

  const [resultado] = data;
  socio.clases_consumidas = resultado.clases_consumidas;
  socio.clases_restantes = resultado.clases_restantes;
  renderizarSocios(filtrarSocios());
}

// ============================================================
// Arranque de la demo: sin login, entra directo con un perfil de ejemplo.
// ============================================================
async function iniciarApp() {
  staffActual = window.DEMO_STAFF;
  $("app").hidden = false;
  $("nombre-usuario").textContent = "Demo interactiva";
  await cargarPlanes();
  await cargarSocios();
}

// ============================================================
// Socios (tabla principal)
// ============================================================
function filaEsqueleto() {
  return `
    <tr>
      <td><span class="skeleton" style="width:140px;"></span></td>
      <td><span class="skeleton" style="width:100px;"></span></td>
      <td><span class="skeleton" style="width:90px;"></span></td>
      <td><span class="skeleton" style="width:70px;"></span></td>
      <td><span class="skeleton" style="width:80px;"></span></td>
      <td><span class="skeleton" style="width:60px;"></span></td>
      <td><span class="skeleton" style="width:60px;"></span></td>
    </tr>`;
}

async function cargarSocios() {
  const tbody = $('tabla-socios');
  $('vacio-socios').hidden = true;
  tbody.innerHTML = Array.from({ length: 6 }, filaEsqueleto).join('');

  const { data, error } = await sb
    .from('v_estado_socios')
    .select('*')
    .order('nombre');
  if (error) return console.error(error.message);

  sociosCache = data;
  const contador = $('contador-socios');
  if (contador) contador.textContent = `(${sociosCache.length})`;
  poblarFiltroPlan();
  renderizarSocios(filtrarSocios());
}

const SIN_PLAN = '__sin_plan__';

// Se arma a partir de los planes que realmente aparecen en sociosCache (no
// de la tabla `planes`) para que incluya también "Sin plan" y cualquier
// plan viejo/inactivo que algún socio todavía tenga asignado.
function poblarFiltroPlan() {
  const select = $('filtro-plan');
  const valorPrevio = select.value;
  const planes = [...new Set(sociosCache.map((s) => s.plan_nombre).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );
  const haySinPlan = sociosCache.some((s) => !s.plan_nombre);

  select.innerHTML = [
    '<option value="">Todos los planes</option>',
    ...planes.map((p) => `<option value="${p}">${p}</option>`),
    haySinPlan ? `<option value="${SIN_PLAN}">Sin plan</option>` : '',
  ].join('');

  if ([...select.options].some((o) => o.value === valorPrevio)) select.value = valorPrevio;
}

// Búsqueda + filtro por estado + orden — 100% client-side sobre lo ya
// cargado (la tabla de socios de un gimnasio chico entra entera en
// memoria sin problema), así que no hace falta ida y vuelta al servidor.
let ordenActual = { campo: 'nombre', direccion: 'asc' };

function filtrarSocios() {
  const q = ($('buscador-socios')?.value || '').trim().toLowerCase();
  const estado = $('filtro-estado')?.value || '';
  const plan = $('filtro-plan')?.value || '';
  let resultado = sociosCache;
  if (estado) resultado = resultado.filter((s) => s.estado_socio === estado);
  if (plan) resultado = resultado.filter((s) => (plan === SIN_PLAN ? !s.plan_nombre : s.plan_nombre === plan));
  if (q) {
    resultado = resultado.filter((s) =>
      (s.nombre || '').toLowerCase().includes(q) || (s.codigo || '').toLowerCase().includes(q)
    );
  }
  return ordenarSocios(resultado);
}

function ordenarSocios(lista) {
  const { campo, direccion } = ordenActual;
  const signo = direccion === 'asc' ? 1 : -1;
  return [...lista].sort((a, b) => {
    if (campo === 'fecha_fin') {
      if (!a.fecha_fin && !b.fecha_fin) return 0;
      if (!a.fecha_fin) return 1; // sin vencimiento va siempre al final
      if (!b.fecha_fin) return -1;
      return signo * a.fecha_fin.localeCompare(b.fecha_fin);
    }
    return signo * (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
  });
}

function actualizarIconosOrden() {
  document.querySelectorAll('.orden-icono').forEach((span) => (span.textContent = ''));
  const icono = $(`orden-icono-${ordenActual.campo}`);
  if (icono) icono.textContent = ordenActual.direccion === 'asc' ? ' ▲' : ' ▼';
}

document.querySelectorAll('.th-ordenable').forEach((th) => {
  th.addEventListener('click', () => {
    const campo = th.dataset.orden;
    ordenActual = ordenActual.campo === campo
      ? { campo, direccion: ordenActual.direccion === 'asc' ? 'desc' : 'asc' }
      : { campo, direccion: 'asc' };
    actualizarIconosOrden();
    renderizarSocios(filtrarSocios());
  });
});
actualizarIconosOrden();

$('filtro-estado').addEventListener('change', () => renderizarSocios(filtrarSocios()));
$('filtro-plan').addEventListener('change', () => renderizarSocios(filtrarSocios()));

function renderizarSocios(data) {
  const tbody = $('tabla-socios');
  tbody.innerHTML = '';
  $('vacio-socios').hidden = data.length > 0;
  $('vacio-socios').textContent = sociosCache.length === 0
    ? 'Todavía no hay socios cargados.'
    : 'Ningún socio coincide con la búsqueda.';

  for (const s of data) {
    const tr = document.createElement('tr');
    tr.style.setProperty('--i', Math.min(data.indexOf(s), 14));
    const deudaClase = s.deuda > 0 ? 'deuda-mal' : 'deuda-ok';
    tr.innerHTML = `
      <td><span class="celda-socio">${avatarHTML(s.nombre)}<span>${s.nombre}</span></span></td>
      <td>${s.celular || '—'}</td>
      <td>${s.plan_nombre || '—'}</td>
      <td>${etiquetaEstado(s.estado_socio)}</td>
      <td>${s.fecha_fin || '—'}</td>
      <td class="${deudaClase}">${formatoMoneda(s.deuda)}</td>
      <td style="white-space:nowrap;">
        ${pillClase(s)}
        <button class="link btn-editar-socio">Editar</button>
        <button class="link btn-vender-renovar">${s.membresia_id ? 'Renovar' : 'Vender'}</button>
        ${s.deuda > 0 ? '<button class="link btn-registrar-pago">Cobrar</button>' : ''}
      </td>
    `;
    tr.querySelector('.btn-editar-socio').addEventListener('click', () => abrirModalEditar(s));
    tr.querySelector('.btn-vender-renovar').addEventListener('click', () =>
      abrirModalMembresia(s)
    );
    const btnPago = tr.querySelector('.btn-registrar-pago');
    if (btnPago) btnPago.addEventListener('click', () => abrirModalPago(s));
    const btnMenos = tr.querySelector('.btn-clase-menos');
    const btnMas = tr.querySelector('.btn-clase-mas');
    if (btnMenos && btnMas) {
      const botones = [btnMenos, btnMas];
      btnMenos.addEventListener('click', () => ajustarAsistenciaClase(botones, s, -1));
      btnMas.addEventListener('click', () => ajustarAsistenciaClase(botones, s, 1));
    }
    tbody.appendChild(tr);
  }
}

$('buscador-socios').addEventListener('input', () => renderizarSocios(filtrarSocios()));

// Exporta lo que se está viendo (respeta el filtro de búsqueda activo) a un
// .xlsx real vía SheetJS — se carga por CDN, sin build.
function exportarSociosExcel() {
  const filas = filtrarSocios().map((s) => ({
    Código: s.codigo || '',
    Nombre: s.nombre,
    Plan: s.plan_nombre || '',
    Estado: etiquetaEstadoTexto(s.estado_socio),
    Vence: s.fecha_fin || '',
    'Clases usadas': s.cantidad_turnos ? `${s.clases_consumidas ?? 0}/${s.cantidad_turnos}` : '',
    Deuda: s.deuda ?? 0,
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Socios');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `gymflow-socios-${fecha}.xlsx`);
}
$('btn-exportar-socios').addEventListener('click', exportarSociosExcel);

// ============================================================
// Solicitud de socio / Vender / Renovar membresía
//
// Un solo modal, tres modos:
//  - 'alta'    : botón "+ Nuevo socio" -> crea socio + membresía + pago
//                juntos (fn_solicitud_socio), en una sola transacción.
//  - 'vender'  : socio existente sin plan todavía -> crea la membresía +
//                pago (fn_vender_membresia). No puede quedar sin plan.
//  - 'renovar' : socio con membresía -> renueva (fn_renovar_membresia). El
//                descuento (si lo tenía y le quedan meses) se hereda solo,
//                no se vuelve a pedir.
// ============================================================
let modoModal = 'alta';
let membresiaActualCache = null; // { plan_id, descuento_pct, descuento_meses_restantes } cuando modoModal === 'renovar'

async function cargarPlanes() {
  const { data, error } = await sb
    .from('planes')
    .select('id, nombre, precio, duracion_dias')
    .eq('activo', true)
    .order('nombre');
  if (error) return console.error(error.message);
  planesCache = data;
}

// El select de plan es compartido entre alta/vender/renovar, pero la opción
// "Alta sin cobro" (deja entrar a alguien gratis, sin membresía ni pago)
// solo tiene sentido al dar de alta un socio nuevo — se agrega/quita acá
// según el modo en vez de dejarla fija en el HTML.
function poblarSelectPlan() {
  const opciones = planesCache.map(
    (p) => `<option value="${p.id}">${p.nombre} — ${formatoMoneda(p.precio)}</option>`
  );
  if (modoModal === 'alta') {
    opciones.push(`<option value="">Alta sin cobro — ${formatoMoneda(0)}</option>`);
  }
  $('mem-plan').innerHTML = opciones.join('');
}

// Sin plan elegido (alta sin cobro): no hay precio, descuento ni pago —
// se ocultan esos campos y método de pago deja de ser obligatorio.
function actualizarVisibilidadPorPlan() {
  const sinCobro = modoModal === 'alta' && !$('mem-plan').value;
  $('grupo-descuento').hidden = modoModal === 'renovar' || sinCobro;
  $('grupo-metodo-pago').hidden = sinCobro;
  $('mem-metodo-pago').required = !sinCobro;
  if (sinCobro) $('grupo-descuento-meses').hidden = true;
}

$('btn-nuevo-socio').addEventListener('click', () => abrirModalMembresia(null, 'alta'));

function abrirModalMembresia(socio, modoForzado) {
  $('form-membresia').reset();
  $('error-membresia').textContent = '';
  membresiaActualCache = null;

  modoModal = modoForzado || (socio.membresia_id ? 'renovar' : 'vender');

  $('mem-socio-id').value = socio ? socio.socio_id : '';
  $('mem-membresia-actual-id').value = socio && socio.membresia_id ? socio.membresia_id : '';

  const titulos = {
    alta: 'Solicitud de socio',
    vender: `Solicitud de socio — ${socio?.nombre || ''}`,
    renovar: `Renovar membresía — ${socio?.nombre || ''}`,
  };
  $('titulo-modal-membresia').textContent = titulos[modoModal];

  $('grupo-datos-personales').hidden = modoModal !== 'alta';
  $('mem-nombre').required = modoModal === 'alta';

  $('grupo-fecha-inicio').hidden = modoModal === 'renovar';
  $('mem-fecha-inicio').value = new Date().toISOString().slice(0, 10);

  $('grupo-descuento').hidden = modoModal === 'renovar';
  $('mem-descuento-pct').value = 0;
  $('grupo-descuento-meses').hidden = true;

  $('mem-metodo-pago').value = '';
  $('grupo-mem-mixto').hidden = true;

  poblarSelectPlan();
  if (planesCache.length) $('mem-plan').value = planesCache[0].id;
  actualizarVisibilidadPorPlan();

  if (modoModal === 'renovar') {
    // Trae el descuento vigente de la membresía actual para poder mostrar
    // en vivo si se hereda o no (fn_renovar_membresia decide lo mismo del
    // lado del servidor; esto es solo para que el staff vea el total antes
    // de confirmar).
    sb.from('membresias')
      .select('plan_id, descuento_pct, descuento_meses_restantes')
      .eq('id', socio.membresia_id)
      .single()
      .then(({ data }) => {
        membresiaActualCache = data || null;
        if (data) $('mem-plan').value = data.plan_id;
        actualizarResumenTotal();
      });
  }

  actualizarResumenTotal();
  abrirModal('modal-membresia');
}

function planSeleccionado() {
  return planesCache.find((p) => p.id === $('mem-plan').value);
}

function calcularTotal() {
  const plan = planSeleccionado();
  if (!plan) return { total: 0, pct: 0, leyenda: '' };

  if (modoModal === 'renovar') {
    const hereda =
      membresiaActualCache &&
      membresiaActualCache.descuento_meses_restantes > 1 &&
      membresiaActualCache.plan_id === plan.id;
    const pct = hereda ? Number(membresiaActualCache.descuento_pct) : 0;
    const total = Math.round(plan.precio * (1 - pct / 100));
    const leyenda = hereda
      ? `Descuento del ${pct}% heredado (quedan ${membresiaActualCache.descuento_meses_restantes - 1} mes(es) después de esta renovación)`
      : '';
    return { total, pct, leyenda };
  }

  const pct = Number($('mem-descuento-pct').value || 0);
  const meses = $('mem-descuento-meses').value;
  const total = Math.round(plan.precio * (1 - pct / 100));
  const leyenda = pct > 0 ? `Descuento del ${pct}% por ${meses} mes(es)` : '';
  return { total, pct, leyenda };
}

function actualizarResumenTotal() {
  const { total, leyenda } = calcularTotal();
  $('resumen-total-valor').textContent = formatoMoneda(total);
  $('resumen-total-leyenda').textContent = leyenda;
  $('resumen-total-leyenda').hidden = !leyenda;
}

$('mem-plan').addEventListener('change', () => {
  actualizarVisibilidadPorPlan();
  actualizarResumenTotal();
});
$('mem-descuento-pct').addEventListener('input', () => {
  const pct = Number($('mem-descuento-pct').value || 0);
  $('grupo-descuento-meses').hidden = !(pct > 0);
  actualizarResumenTotal();
});
$('mem-descuento-meses').addEventListener('change', actualizarResumenTotal);

$('mem-metodo-pago').addEventListener('change', () => {
  $('grupo-mem-mixto').hidden = $('mem-metodo-pago').value !== 'mixto';
});

// Split efectivo/transferencia: para un solo método, todo el total va a ese
// bucket; para "mixto" se leen los dos montos y tienen que sumar el total
// exacto (si no, error - no hay forma correcta de adivinar la diferencia).
function leerSplitPago(metodo, total, montoEfectivoId, montoTransferenciaId) {
  if (metodo === 'efectivo') return { efectivo: total, transferencia: 0 };
  if (metodo === 'transferencia') return { efectivo: 0, transferencia: total };
  if (metodo === 'mixto') {
    const efectivo = Number($(montoEfectivoId).value || 0);
    const transferencia = Number($(montoTransferenciaId).value || 0);
    if (efectivo + transferencia !== total) {
      throw new Error(
        `Efectivo + transferencia (${formatoMoneda(efectivo + transferencia)}) tiene que sumar el total (${formatoMoneda(total)}).`
      );
    }
    return { efectivo, transferencia };
  }
  throw new Error('Elegí un método de pago.');
}

$('form-membresia').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-membresia').textContent = '';

  const planId = $('mem-plan').value;
  const sinCobro = modoModal === 'alta' && !planId;
  const fechaInicio = $('mem-fecha-inicio').value;
  const metodoPago = $('mem-metodo-pago').value;

  if (!sinCobro && !planId) return mostrarError('error-membresia', { message: 'Elegí un plan.' });
  if (modoModal === 'alta' && !$('mem-nombre').value.trim()) {
    return mostrarError('error-membresia', { message: 'El nombre es obligatorio.' });
  }

  const { total, pct } = calcularTotal();
  const pctInput = modoModal === 'renovar' || sinCobro ? null : pct;
  const mesesInput = modoModal === 'renovar' || sinCobro ? null : (pct > 0 ? Number($('mem-descuento-meses').value) : null);

  let split = { efectivo: null, transferencia: null };
  if (!sinCobro) {
    try {
      split = leerSplitPago(metodoPago, total, 'mem-monto-efectivo', 'mem-monto-transferencia');
    } catch (err) {
      return mostrarError('error-membresia', err);
    }
  }

  const btn = $('btn-guardar-membresia');
  btn.disabled = true;
  try {
    let resp;
    if (modoModal === 'alta') {
      resp = await sb.rpc('fn_solicitud_socio', {
        p_tenant_id: staffActual.tenant_id,
        p_nombre: $('mem-nombre').value.trim(),
        p_email: $('mem-email').value.trim() || null,
        p_celular: $('mem-celular').value.trim() || null,
        p_plan_id: sinCobro ? null : planId,
        p_fecha_inicio: fechaInicio,
        p_descuento_pct: pctInput,
        p_descuento_meses: mesesInput,
        p_monto_efectivo: split.efectivo,
        p_monto_transferencia: split.transferencia,
        p_cobrado_por: staffActual.id,
      });
    } else if (modoModal === 'vender') {
      resp = await sb.rpc('fn_vender_membresia', {
        p_tenant_id: staffActual.tenant_id,
        p_socio_id: $('mem-socio-id').value,
        p_plan_id: planId,
        p_fecha_inicio: fechaInicio,
        p_descuento_pct: pctInput,
        p_descuento_meses: mesesInput,
        p_monto_efectivo: split.efectivo,
        p_monto_transferencia: split.transferencia,
        p_cobrado_por: staffActual.id,
      });
    } else {
      resp = await sb.rpc('fn_renovar_membresia', {
        p_membresia_actual_id: $('mem-membresia-actual-id').value,
        p_plan_id: planId,
        p_monto_efectivo: split.efectivo,
        p_monto_transferencia: split.transferencia,
        p_cobrado_por: staffActual.id,
      });
    }

    if (resp.error) return mostrarError('error-membresia', resp.error);
    cerrarModal('modal-membresia');
    await cargarSocios();
  } finally {
    btn.disabled = false;
  }
});

// ============================================================
// Editar datos de un socio (nombre / celular / email mal tipeados)
// ============================================================
async function abrirModalEditar(socio) {
  $('error-editar-socio').textContent = '';
  const { data, error } = await sb
    .from('socios')
    .select('nombre, celular, email, inactivo')
    .eq('id', socio.socio_id)
    .single();
  if (error) return mostrarError('error-editar-socio', error);

  $('form-editar-socio').reset();
  $('editar-socio-id').value = socio.socio_id;
  $('editar-nombre').value = data.nombre || '';
  $('editar-celular').value = data.celular || '';
  $('editar-email').value = data.email || '';
  $('editar-inactivo').checked = !!data.inactivo;
  abrirModal('modal-editar-socio');
}

$('form-editar-socio').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-editar-socio').textContent = '';
  const nombre = $('editar-nombre').value.trim();
  if (!nombre) return mostrarError('error-editar-socio', { message: 'El nombre es obligatorio.' });

  const { error } = await sb
    .from('socios')
    .update({
      nombre,
      celular: $('editar-celular').value.trim() || null,
      email: $('editar-email').value.trim() || null,
      inactivo: $('editar-inactivo').checked,
    })
    .eq('id', $('editar-socio-id').value);
  if (error) return mostrarError('error-editar-socio', error);
  cerrarModal('modal-editar-socio');
  await cargarSocios();
});

// ============================================================
// Registrar pago suelto (para saldar deuda de una membresía existente)
// ============================================================
function abrirModalPago(socio) {
  $('form-pago').reset();
  $('error-pago').textContent = '';
  $('grupo-pago-mixto').hidden = true;
  $('pago-membresia-id').value = socio.membresia_id;
  $('pago-monto').value = socio.deuda;
  abrirModal('modal-pago');
}

$('pago-metodo').addEventListener('change', () => {
  $('grupo-pago-mixto').hidden = $('pago-metodo').value !== 'mixto';
});

$('form-pago').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-pago').textContent = '';

  let split;
  try {
    split = leerSplitPago($('pago-metodo').value, Number($('pago-monto').value), 'pago-monto-efectivo', 'pago-monto-transferencia');
  } catch (err) {
    return mostrarError('error-pago', err);
  }

  const filas = [];
  if (split.efectivo > 0) filas.push({ metodo_pago: 'efectivo', monto: split.efectivo });
  if (split.transferencia > 0) filas.push({ metodo_pago: 'transferencia', monto: split.transferencia });

  const { error } = await sb.from('pagos').insert(
    filas.map((f) => ({
      tenant_id: staffActual.tenant_id,
      membresia_id: $('pago-membresia-id').value,
      monto: f.monto,
      metodo_pago: f.metodo_pago,
      cobrado_por: staffActual.id,
    }))
  );
  if (error) return mostrarError('error-pago', error);
  cerrarModal('modal-pago');
  await cargarSocios();
});

// ============================================================
// Caja: ingresos ya registrados (pagos) + gastos, detrás de un PIN
// separado del login. El PIN se re-pide cada vez que se vuelve a esta
// vista (cajaDesbloqueada se resetea en irAVista). El frontend nunca lee
// gimnasios.pin_caja directo, solo a través de las funciones RPC.
// ============================================================
let cajaDesbloqueada = false;

function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

async function mostrarCaja() {
  $('caja-bloqueada').hidden = true;
  $('caja-contenido').hidden = true;

  if (cajaDesbloqueada) {
    $('caja-contenido').hidden = false;
    return cargarCaja();
  }

  const { data: requierePin, error } = await sb.rpc('fn_caja_pin_configurado', {
    p_tenant_id: staffActual.tenant_id,
  });
  if (error) return console.error(error.message);

  if (!requierePin) {
    cajaDesbloqueada = true;
    $('caja-contenido').hidden = false;
    return cargarCaja();
  }

  $('error-pin-caja').textContent = '';
  $('pin-caja-input').value = '';
  $('caja-bloqueada').hidden = false;
}

$('form-pin-caja').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-pin-caja').textContent = '';
  const { data: ok, error } = await sb.rpc('fn_verificar_pin_caja', {
    p_tenant_id: staffActual.tenant_id,
    p_pin: $('pin-caja-input').value.trim(),
  });
  if (error) return mostrarError('error-pin-caja', error);
  if (!ok) return mostrarError('error-pin-caja', { message: 'PIN incorrecto.' });

  cajaDesbloqueada = true;
  $('caja-bloqueada').hidden = true;
  $('caja-contenido').hidden = false;
  await cargarCaja();
});

function cargarCaja() {
  if (!$('caja-fecha').value) $('caja-fecha').value = new Date().toISOString().slice(0, 10);
  if (!$('caja-mes').value) $('caja-mes').value = new Date().toISOString().slice(0, 7);
  return Promise.all([cargarSaldoCaja(), cargarMovimientos(), cargarGastosPendientes()]);
}

// Por día (una fecha exacta) o por mes (todo el mes elegido) - el toggle
// solo cambia qué input se ve y qué rango de fechas se pide, el resto de
// la lógica de carga es la misma.
$('caja-modo-filtro').addEventListener('change', () => {
  const esMes = $('caja-modo-filtro').value === 'mes';
  $('caja-fecha').hidden = esMes;
  $('caja-mes').hidden = !esMes;
  cargarMovimientos();
});

function rangoCajaElegido() {
  if ($('caja-modo-filtro').value === 'mes') {
    const [anio, mes] = $('caja-mes').value.split('-').map(Number);
    const desde = `${$('caja-mes').value}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const hasta = `${$('caja-mes').value}-${String(ultimoDia).padStart(2, '0')}`;
    return { desde, hasta };
  }
  return { desde: $('caja-fecha').value, hasta: $('caja-fecha').value };
}

const sumaPor = (lista, metodo, signo) =>
  lista.filter((p) => p.metodo_pago === metodo).reduce((acc, p) => acc + signo(p) * Number(p.monto), 0);

// "Saldo actual": acumulado de TODA la historia (sin filtro de fecha), no
// cambia al mirar movimientos de un día pasado — es la respuesta a
// "cuánto hay en caja ahora", no a "cuánto entró tal día".
async function cargarSaldoCaja() {
  const [{ data: pagos, error: errPagos }, { data: gastos, error: errGastos }] = await Promise.all([
    sb.from('pagos').select('monto, tipo, metodo_pago').is('anulado_en', null),
    // Los gastos pendientes (metodo_pago null, todavia sin efectivizar) no
    // cuentan para el saldo - recien afectan la caja cuando se confirman.
    sb.from('gastos').select('monto, metodo_pago').is('anulado_en', null).not('metodo_pago', 'is', null),
  ]);
  if (errPagos || errGastos) return console.error((errPagos || errGastos).message);

  const netoPor = (metodo) =>
    sumaPor(pagos, metodo, (p) => (p.tipo === 'reembolso' ? -1 : 1)) - sumaPor(gastos, metodo, () => 1);

  const efectivo = netoPor('efectivo');
  const transferencia = netoPor('transferencia');

  // Efectivo y Transferencia quedan en blanco (son datos, no un juicio de
  // "bien/mal") — el color de signo se reserva solo para el Total.
  $('caja-saldo-efectivo').textContent = formatoMoneda(efectivo);
  $('caja-saldo-transferencia').textContent = formatoMoneda(transferencia);

  const total = efectivo + transferencia;
  const elTotal = $('caja-saldo-total');
  elTotal.textContent = formatoMoneda(total);
  elTotal.classList.toggle('deuda-ok', total >= 0);
  elTotal.classList.toggle('deuda-mal', total < 0);
  ['caja-saldo-efectivo', 'caja-saldo-transferencia', 'caja-saldo-total'].forEach((id) => contar($(id)));
}

// Movimientos del período elegido (día o mes) — solo para mirar el
// historial, no afecta ni se confunde con el saldo actual de arriba. Los
// gastos pendientes (sin efectivizar) no aparecen acá, tienen su propia
// sub-pestaña. Se cachean para poder filtrar por tipo (ingreso/gasto) sin
// volver a pedirlos a la base.
let movimientosCajaCache = [];

async function cargarMovimientos() {
  const { desde, hasta } = rangoCajaElegido();

  // Ojo: NO se filtra por anulado_en - los anulados se muestran igual
  // (tachados) para que anular un pago en efectivo no sea una forma de
  // hacerlo desaparecer sin dejar rastro.
  const [{ data: pagosDia, error: errPagos }, { data: gastosDia, error: errGastos }] = await Promise.all([
    sb.from('pagos')
      .select('id, monto, tipo, metodo_pago, created_at, anulado_en, motivo_anulacion, membresias(socios(nombre))')
      .gte('fecha_pago', desde)
      .lte('fecha_pago', hasta),
    sb.from('gastos')
      .select('id, concepto, monto, metodo_pago, fecha, created_at, anulado_en, motivo_anulacion')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .not('metodo_pago', 'is', null),
  ]);
  if (errPagos || errGastos) return console.error((errPagos || errGastos).message);

  movimientosCajaCache = [
    ...pagosDia.map((p) => ({
      id: p.id,
      origen: 'pagos',
      hora: p.created_at,
      tipo: p.tipo === 'reembolso' ? 'Reembolso' : 'Ingreso',
      detalle: p.membresias?.socios?.nombre || '—',
      metodo: p.metodo_pago,
      monto: (p.tipo === 'reembolso' ? -1 : 1) * Number(p.monto),
      anulado: !!p.anulado_en,
      motivoAnulacion: p.motivo_anulacion,
    })),
    ...gastosDia.map((g) => ({
      id: g.id,
      origen: 'gastos',
      hora: g.created_at,
      tipo: 'Gasto',
      detalle: g.concepto,
      metodo: g.metodo_pago,
      monto: -Number(g.monto),
      anulado: !!g.anulado_en,
      motivoAnulacion: g.motivo_anulacion,
    })),
  ].sort((a, b) => a.hora.localeCompare(b.hora));

  renderizarMovimientosCaja();
}

$('caja-filtro-tipo').addEventListener('change', renderizarMovimientosCaja);

function renderizarMovimientosCaja() {
  const filtroTipo = $('caja-filtro-tipo').value;
  const movimientos = movimientosCajaCache.filter((m) => {
    if (filtroTipo === 'ingreso') return m.origen === 'pagos';
    if (filtroTipo === 'gasto') return m.origen === 'gastos';
    return true;
  });

  const tbody = $('tabla-caja');
  tbody.innerHTML = '';
  $('vacio-caja').hidden = movimientos.length > 0;
  for (const m of movimientos) {
    const tr = document.createElement('tr');
    tr.classList.toggle('movimiento-anulado', m.anulado);
    tr.style.setProperty('--i', Math.min(movimientos.indexOf(m), 14));
    const accion = m.anulado
      ? `<span class="etiqueta-anulado" title="${m.motivoAnulacion ? `Motivo: ${m.motivoAnulacion}` : 'Sin motivo registrado'}">Anulado</span>`
      : staffActual.rol === 'owner'
        ? '<button type="button" class="link btn-anular-movimiento">Anular</button>'
        : '';
    tr.innerHTML = `
      <td>${formatoHora(m.hora)}</td>
      <td><span class="tag ${m.monto < 0 ? 'gas' : 'ing'}">${m.tipo}</span></td>
      <td>${m.detalle}</td>
      <td>${m.metodo === 'efectivo' ? 'Efectivo' : 'Transferencia'}</td>
      <td class="monto ${m.monto < 0 ? 'deuda-mal' : 'deuda-ok'}">${m.monto < 0 ? '−' + formatoMoneda(-m.monto) : '+' + formatoMoneda(m.monto)}</td>
      <td>${accion}</td>
    `;
    const btnAnular = tr.querySelector('.btn-anular-movimiento');
    if (btnAnular) btnAnular.addEventListener('click', () => abrirModalAnularMovimiento(m));
    tbody.appendChild(tr);
  }
}

$('caja-fecha').addEventListener('change', cargarMovimientos);
$('caja-mes').addEventListener('change', cargarMovimientos);

// Sub-pestañas de Caja: Movimientos (lo de siempre) vs Gastos pendientes
// (el repositorio nuevo).
document.querySelectorAll('.caja-subtab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.caja-subtab').forEach((b) => b.classList.toggle('is-active', b === btn));
    $('caja-panel-movimientos').hidden = btn.dataset.subtab !== 'movimientos';
    $('caja-panel-pendientes').hidden = btn.dataset.subtab !== 'pendientes';
  });
});

// Gastos pendientes: cargados sin metodo_pago todavia - no afectan el
// saldo ni aparecen en Movimientos hasta que alguien los "Efectiviza".
async function cargarGastosPendientes() {
  const { data, error } = await sb
    .from('gastos')
    .select('id, concepto, monto, fecha')
    .is('metodo_pago', null)
    .is('anulado_en', null)
    .order('fecha');
  if (error) return console.error(error.message);

  const badge = $('badge-gastos-pendientes');
  badge.hidden = data.length === 0;
  badge.textContent = data.length;

  const tbody = $('tabla-gastos-pendientes');
  tbody.innerHTML = '';
  $('vacio-gastos-pendientes').hidden = data.length > 0;
  for (const g of data) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.fecha}</td>
      <td>${g.concepto}</td>
      <td>${formatoMoneda(g.monto)}</td>
      <td>
        <button type="button" class="link btn-efectivizar-gasto">Efectivizar</button>
        ${staffActual.rol === 'owner' ? '<button type="button" class="link btn-anular-movimiento">Anular</button>' : ''}
      </td>
    `;
    tr.querySelector('.btn-efectivizar-gasto').addEventListener('click', () => abrirModalGasto(g));
    const btnAnular = tr.querySelector('.btn-anular-movimiento');
    if (btnAnular) btnAnular.addEventListener('click', () => abrirModalAnularMovimiento({ origen: 'gastos', id: g.id, tipo: 'Gasto', detalle: g.concepto, monto: -g.monto }));
    tbody.appendChild(tr);
  }
}

// Anular pago/gasto (solo owner, el backend lo vuelve a validar vía
// trigger append-only — este chequeo de rol acá es solo para no mostrar el
// botón a quien de todos modos no puede usarlo).
let movimientoAAnular = null;
function abrirModalAnularMovimiento(m) {
  movimientoAAnular = m;
  $('form-anular-movimiento').reset();
  $('error-anular-movimiento').textContent = '';
  $('anular-movimiento-detalle').textContent = `${m.tipo} · ${m.detalle} · ${formatoMoneda(Math.abs(m.monto))}`;
  abrirModal('modal-anular-movimiento');
}

$('form-anular-movimiento').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-anular-movimiento').textContent = '';
  const { error } = await sb
    .from(movimientoAAnular.origen)
    .update({
      anulado_en: new Date().toISOString(),
      anulado_por: staffActual.id,
      motivo_anulacion: $('anular-movimiento-motivo').value.trim() || null,
    })
    .eq('id', movimientoAAnular.id);
  if (error) return mostrarError('error-anular-movimiento', error);
  cerrarModal('modal-anular-movimiento');
  await cargarCaja();
});

// Exporta TODO el historial de movimientos (no solo el día filtrado en
// pantalla) — pensado para bajar la data completa si en algún momento la
// necesitan afuera del sistema.
async function exportarCajaExcel() {
  const [{ data: pagos, error: errPagos }, { data: gastos, error: errGastos }] = await Promise.all([
    sb.from('pagos')
      .select('fecha_pago, monto, tipo, metodo_pago, created_at, anulado_en, motivo_anulacion, membresias(socios(nombre))'),
    // Los gastos pendientes (sin efectivizar) quedan afuera - no son
    // movimientos reales todavia.
    sb.from('gastos')
      .select('fecha, concepto, monto, metodo_pago, created_at, anulado_en, motivo_anulacion')
      .not('metodo_pago', 'is', null),
  ]);
  if (errPagos || errGastos) return console.error((errPagos || errGastos).message);

  const movimientos = [
    ...pagos.map((p) => ({
      fecha: p.fecha_pago,
      hora: p.created_at,
      tipo: p.tipo === 'reembolso' ? 'Reembolso' : 'Ingreso',
      detalle: p.membresias?.socios?.nombre || '—',
      metodo: p.metodo_pago,
      monto: (p.tipo === 'reembolso' ? -1 : 1) * Number(p.monto),
      anulado: !!p.anulado_en,
      motivoAnulacion: p.motivo_anulacion,
    })),
    ...gastos.map((g) => ({
      fecha: g.fecha,
      hora: g.created_at,
      tipo: 'Gasto',
      detalle: g.concepto,
      metodo: g.metodo_pago,
      monto: -Number(g.monto),
      anulado: !!g.anulado_en,
      motivoAnulacion: g.motivo_anulacion,
    })),
  ].sort((a, b) => a.hora.localeCompare(b.hora));

  const filas = movimientos.map((m) => ({
    Fecha: m.fecha,
    Hora: formatoHora(m.hora),
    Tipo: m.tipo,
    Detalle: m.detalle,
    Método: m.metodo === 'efectivo' ? 'Efectivo' : 'Transferencia',
    Monto: m.monto,
    Anulado: m.anulado ? 'Sí' : 'No',
    'Motivo anulación': m.motivoAnulacion || '',
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 24 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Caja');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `gymflow-caja-completo-${fecha}.xlsx`);
}
$('btn-exportar-caja').addEventListener('click', exportarCajaExcel);

$('btn-nuevo-gasto').addEventListener('click', () => {
  $('form-gasto').reset();
  $('error-gasto').textContent = '';
  $('gasto-editar-id').value = '';
  $('titulo-modal-gasto').textContent = 'Registrar gasto';
  $('btn-guardar-gasto').textContent = 'Guardar';
  $('gasto-metodo').required = false;
  $('gasto-fecha').value = new Date().toISOString().slice(0, 10);
  abrirModal('modal-gasto');
});

// Reutiliza el mismo modal para "Efectivizar" un gasto pendiente: precarga
// sus datos y exige método (efectivizar sin método no tendría sentido).
function abrirModalGasto(gasto) {
  $('form-gasto').reset();
  $('error-gasto').textContent = '';
  $('gasto-editar-id').value = gasto.id;
  $('titulo-modal-gasto').textContent = 'Efectivizar gasto';
  $('btn-guardar-gasto').textContent = 'Efectivizar';
  $('gasto-concepto').value = gasto.concepto;
  $('gasto-monto').value = gasto.monto;
  $('gasto-fecha').value = gasto.fecha;
  $('gasto-metodo').value = '';
  $('gasto-metodo').required = true;
  abrirModal('modal-gasto');
}

$('form-gasto').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-gasto').textContent = '';
  const editandoId = $('gasto-editar-id').value;
  const datos = {
    concepto: $('gasto-concepto').value.trim(),
    monto: Number($('gasto-monto').value),
    metodo_pago: $('gasto-metodo').value || null,
    fecha: $('gasto-fecha').value,
  };

  const { error } = editandoId
    ? await sb.from('gastos').update(datos).eq('id', editandoId)
    : await sb.from('gastos').insert({ ...datos, tenant_id: staffActual.tenant_id, registrado_por: staffActual.id });
  if (error) return mostrarError('error-gasto', error);
  cerrarModal('modal-gasto');
  await cargarCaja();
});

// ============================================================
// Calendario: turnos_fijos — solo anotación de referencia para el staff
// (quién suele venir a qué horario). No reserva lugar, no valida
// capacidad, no lo usan los socios.
//
// Los horarios son fijos (los mismos todos los días de lunes a viernes,
// más el Open Box del sábado) — por eso el alta es un desplegable de
// turnos, no un horario libre.
// ============================================================
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_LABORALES = [1, 2, 3, 4, 5]; // lunes a viernes — el sábado se muestra aparte
const TURNOS_LUNES_A_VIERNES = [
  ['08:00:00', '09:00:00'],
  ['09:00:00', '10:00:00'],
  ['17:00:00', '18:00:00'],
  ['18:00:00', '19:00:00'],
  ['19:00:00', '20:00:00'],
];
const TURNO_SABADO = ['09:00:00', '13:00:00'];

let turnosCache = [];

function turnosDelDia(diaSemana) {
  return Number(diaSemana) === 6 ? [TURNO_SABADO] : TURNOS_LUNES_A_VIERNES;
}

async function cargarTurnos() {
  const { data, error } = await sb
    .from('turnos_fijos')
    .select('id, dia_semana, hora_inicio, hora_fin, socios(nombre)')
    .eq('activo', true)
    .order('dia_semana')
    .order('hora_inicio');
  if (error) return console.error(error.message);
  turnosCache = data;
  renderizarCalendario();
}

function iniciales(nombre) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
  const ini = (partes[0]?.[0] || '') + (partes[1]?.[0] || '');
  return ini.toUpperCase() || '?';
}

function chipTurno(t) {
  const nombre = t.socios?.nombre || '—';
  return `
    <span class="calendario-turno-chip" style="--h:${colorAvatar(nombre)}" title="${nombre}">
      ${iniciales(nombre)}
      <button type="button" data-id="${t.id}" title="Quitar a ${nombre}" aria-label="Quitar a ${nombre}">×</button>
    </span>`;
}

function renderizarCalendario() {
  const celdas = [
    '<div class="calendario-celda calendario-esquina"></div>',
    ...DIAS_LABORALES.map((d) => `<div class="calendario-celda calendario-dia-header">${DIAS_SEMANA[d]}</div>`),
  ];

  for (const [horaInicio, horaFin] of TURNOS_LUNES_A_VIERNES) {
    celdas.push(
      `<div class="calendario-celda calendario-hora-label">${horaInicio.slice(0, 5)} a ${horaFin.slice(0, 5)}</div>`
    );
    for (const dia of DIAS_LABORALES) {
      const turnos = turnosCache.filter(
        (t) => t.dia_semana === dia && t.hora_inicio === horaInicio && t.hora_fin === horaFin
      );
      celdas.push(`
        <div class="calendario-celda calendario-turno-celda" data-dia="${dia}" data-hora-inicio="${horaInicio}" data-hora-fin="${horaFin}">
          ${turnos.map(chipTurno).join('')}
        </div>
      `);
    }
  }

  $('calendario-grid').innerHTML = celdas.join('');
  const hoyDia = new Date().getDay();
  if (hoyDia >= 1 && hoyDia <= 5) $('calendario-grid').querySelectorAll('.calendario-celda').forEach((c, i) => { if (i % 6 === hoyDia) c.classList.add('es-hoy'); });

  const turnosSabado = turnosCache.filter((t) => t.dia_semana === 6);
  $('calendario-sabado-nombres').innerHTML =
    turnosSabado.map(chipTurno).join('') || '<span class="ayuda-calendario" style="margin:0;">Click para agregar</span>';

  document.querySelectorAll('.calendario-turno-celda, .calendario-sabado-nombres').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // el click de "quitar" no debe abrir el alta
      const dia = el.dataset.dia ? Number(el.dataset.dia) : 6;
      const horaInicio = el.dataset.horaInicio || TURNO_SABADO[0];
      const horaFin = el.dataset.horaFin || TURNO_SABADO[1];
      abrirModalTurno(dia, horaInicio, horaFin);
    });
  });
  document.querySelectorAll('.calendario-turno-chip button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      quitarTurno(btn.dataset.id);
    });
  });
}

async function quitarTurno(id) {
  const { error } = await sb.from('turnos_fijos').delete().eq('id', id);
  if (error) return console.error(error.message);
  await cargarTurnos();
}

function poblarSelectHorario(diaSemana) {
  $('turno-horario').innerHTML = turnosDelDia(diaSemana)
    .map(([ini, fin]) => `<option value="${ini}|${fin}">${ini.slice(0, 5)} a ${fin.slice(0, 5)}</option>`)
    .join('');
}

function abrirModalTurno(diaPreseleccionado, horaInicioPreseleccionada, horaFinPreseleccionada) {
  $('form-turno').reset();
  $('error-turno').textContent = '';
  $('turno-socio-id').innerHTML = [...sociosCache]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    .map((s) => `<option value="${s.socio_id}">${s.nombre}</option>`)
    .join('');

  if (diaPreseleccionado) $('turno-dia').value = String(diaPreseleccionado);
  poblarSelectHorario($('turno-dia').value);
  if (horaInicioPreseleccionada) {
    $('turno-horario').value = `${horaInicioPreseleccionada}|${horaFinPreseleccionada}`;
  }

  abrirModal('modal-turno');
}

$('turno-dia').addEventListener('change', () => poblarSelectHorario($('turno-dia').value));

$('btn-nuevo-turno').addEventListener('click', () => abrirModalTurno());

$('form-turno').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error-turno').textContent = '';
  const [horaInicio, horaFin] = $('turno-horario').value.split('|');

  const { error } = await sb.from('turnos_fijos').insert({
    tenant_id: staffActual.tenant_id,
    socio_id: $('turno-socio-id').value,
    dia_semana: Number($('turno-dia').value),
    hora_inicio: horaInicio,
    hora_fin: horaFin,
  });
  if (error) return mostrarError('error-turno', error);
  cerrarModal('modal-turno');
  await cargarTurnos();
});

// ============================================================
// Dashboard: KPIs generales y altas por mes. Reusa sociosCache (ya
// cargado). "Socios en riesgo" (fn_socios_en_riesgo) se sacó del dashboard:
// solo tenía sentido para el plan 8 clases (que sí registra asistencias
// para controlar el cupo), no para FULL (asistencia ilimitada, sin
// necesidad de contar clases) - mezclar ambos en un mismo ranking de
// "riesgo" no era representativo.
// ============================================================
async function cargarDashboard() {
  renderizarKpisDashboard();
  await cargarAltasPorMes();
}

const ICONOS_KPI = {
  activo: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
  por_vencer: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  vencido: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  inactivo: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  total: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
};
const COLORES_ESTADO = { activo: '#22c55e', por_vencer: '#f59e0b', vencido: '#ef4444', inactivo: '#64748b' };
const NOMBRES_ESTADO = { activo: 'Activos', por_vencer: 'Por vencer', vencido: 'Vencidos', inactivo: 'Inactivos' };

function renderizarKpisDashboard() {
  const conteo = { activo: 0, por_vencer: 0, vencido: 0, inactivo: 0 };
  for (const s of sociosCache) conteo[s.estado_socio] = (conteo[s.estado_socio] || 0) + 1;
  const total = sociosCache.length || 1;

  const tiles = [
    ['activo', 'Activos', conteo.activo],
    ['por_vencer', 'Por vencer', conteo.por_vencer],
    ['vencido', 'Vencidos', conteo.vencido],
    ['inactivo', 'Inactivos', conteo.inactivo],
    ['total', 'Total', sociosCache.length],
  ];
  $('dashboard-kpis').innerHTML = tiles
    .map(
      ([clave, label, valor], i) => `
    <div class="kpi kpi-${clave}" style="--i:${i}">
      <span class="kpi-icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONOS_KPI[clave]}</svg></span>
      <span class="kpi-label">${label}</span>
      <span class="kpi-valor">${valor}</span>
      <span class="kpi-barra"><i style="width:${clave === 'total' ? 100 : Math.round((valor / total) * 100)}%"></i></span>
    </div>`
    )
    .join('');
  $('dashboard-kpis').querySelectorAll('.kpi-valor').forEach(contar);

  renderizarEstadoDashboard(conteo);
  renderizarVencimientosDashboard();
}

function renderizarEstadoDashboard(conteo) {
  const total = sociosCache.length;
  const R = 52, C = 2 * Math.PI * R;
  let acum = 0;
  const arcos = Object.keys(NOMBRES_ESTADO)
    .filter((k) => conteo[k] > 0)
    .map((k) => {
      const largo = (conteo[k] / total) * C;
      const arco = `<circle class="donut-arco" cx="70" cy="70" r="${R}" fill="none" stroke="${COLORES_ESTADO[k]}" stroke-width="15" stroke-linecap="butt"
        data-largo="${largo.toFixed(2)}" data-c="${C.toFixed(2)}" stroke-dasharray="0 ${C.toFixed(2)}" stroke-dashoffset="${(-acum).toFixed(2)}" transform="rotate(-90 70 70)"><title>${NOMBRES_ESTADO[k]}: ${conteo[k]}</title></circle>`;
      acum += largo;
      return arco;
    })
    .join('');
  $('dashboard-estado').innerHTML = `
    <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Estado de los socios">
      <circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--gris)" stroke-width="15" opacity="0.5"/>
      ${arcos}
      <text x="70" y="68" text-anchor="middle" class="donut-num">${total}</text>
      <text x="70" y="86" text-anchor="middle" class="donut-txt">socios</text>
    </svg>
    <ul class="donut-leyenda">
      ${Object.keys(NOMBRES_ESTADO).map((k) => `<li><i style="background:${COLORES_ESTADO[k]}"></i><span>${NOMBRES_ESTADO[k]}</span><b>${conteo[k] || 0}</b></li>`).join('')}
    </ul>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('dashboard-estado').querySelectorAll('.donut-arco').forEach((c) => {
      c.setAttribute('stroke-dasharray', `${Math.max(0, c.dataset.largo - 2)} ${c.dataset.c}`);
    });
  }));
}

function renderizarVencimientosDashboard() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const lista = sociosCache
    .filter((s) => (s.estado_socio === 'por_vencer' || s.estado_socio === 'vencido') && s.fecha_fin)
    .sort((a, b) => a.fecha_fin.localeCompare(b.fecha_fin))
    .slice(0, 6);
  const cont = $('dashboard-vencen');
  if (!lista.length) { cont.innerHTML = '<p class="vacio">No hay vencimientos para mostrar.</p>'; return; }
  cont.innerHTML = lista.map((s, i) => {
    const dias = Math.round((new Date(s.fecha_fin + 'T00:00:00') - hoy) / 86400000);
    const cuando = dias === 0 ? 'vence hoy' : dias > 0 ? `en ${dias} día${dias === 1 ? '' : 's'}` : `hace ${-dias} día${dias === -1 ? '' : 's'}`;
    return `<div class="venc-fila" style="--i:${i}">
      ${avatarHTML(s.nombre)}
      <div class="venc-datos"><b>${s.nombre}</b><span>${s.plan_nombre || 'Sin plan'}</span></div>
      <span class="pill ${s.estado_socio}">${dias < 0 ? 'Venció' : 'Vence'} ${cuando.replace('vence ', '')}</span>
      <button type="button" class="link venc-renovar" data-i="${i}">Renovar</button>
    </div>`;
  }).join('');
  cont.querySelectorAll('.venc-renovar').forEach((b) => b.addEventListener('click', () => abrirModalMembresia(lista[Number(b.dataset.i)])));
}

async function cargarAltasPorMes() {
  const { data, error } = await sb.from('socios').select('created_at');
  if (error) return console.error(error.message);

  const hoy = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    return { clave: `${d.getFullYear()}-${d.getMonth()}`, etiqueta: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''), total: 0 };
  });

  for (const s of data) {
    const d = new Date(s.created_at);
    const mes = meses.find((m) => m.clave === `${d.getFullYear()}-${d.getMonth()}`);
    if (mes) mes.total++;
  }

  const maximo = Math.max(...meses.map((m) => m.total), 1);
  $('dashboard-altas').innerHTML = meses
    .map(
      (m, i) => `
    <div class="dashboard-barra-col${i === meses.length - 1 ? ' actual' : ''}" style="--i:${i}">
      <span class="dashboard-barra-valor">${m.total}</span>
      <div class="dashboard-barra" style="height:${Math.max(4, Math.round((m.total / maximo) * 100))}%" title="${m.etiqueta}: ${m.total} alta(s)"></div>
      <span class="dashboard-barra-mes">${m.etiqueta}</span>
    </div>`
    )
    .join('');
}

// ============================================================
// (Rutinas se sacó de este esqueleto genérico - es específico de
// gimnasios. Ver bestia-starter-kit/README.md si hace falta reponerlo.)
// ============================================================
/* RUTINAS_DESACTIVADO
const RUTINA_CATEGORIAS = [
  { clave: 'movilidad', label: 'Movilidad' },
  { clave: 'zona_media', label: 'Zona Media' },
  { clave: 'fuerza_estructura', label: 'Fuerza / Estructura' },
  { clave: 'divisor', label: 'BLOQUES FINALES A ELECCIÓN' },
  { clave: 'bestia_jr', label: 'Bestia Jr.' },
  { clave: 'bestia', label: 'Bestia' },
  { clave: 'bestia_2_0', label: 'Bestia 2.0' },
];
const RUTINA_DIAS = [1, 2, 3, 4, 5, 6]; // lunes a sábado

let semanaRutinaActual = null; // 'YYYY-MM-DD' del lunes de la semana elegida
let grillaRutinasConstruida = false;

function lunesDe(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=domingo..6=sábado
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}
function fechaISO(d) {
  return d.toISOString().slice(0, 10);
}

// Autoajuste de altura: la celda crece sola para mostrar todo el texto sin
// scroll interno, en vez de depender de que alguien la estire a mano.
function autoAlturaRutina(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

function construirGrillaRutinas() {
  const celdas = ['<div class="rutina-celda-esquina"></div>', ...RUTINA_DIAS.map((d) => `<div class="rutina-dia-header">${DIAS_SEMANA[d]}</div>`)];

  for (const cat of RUTINA_CATEGORIAS) {
    if (cat.clave === 'divisor') {
      celdas.push(`<div class="rutina-divisor">${cat.label}</div>`);
      continue;
    }
    celdas.push(`<div class="rutina-fila-label">${cat.label}</div>`);
    for (const dia of RUTINA_DIAS) {
      celdas.push(
        `<textarea class="rutina-celda" rows="3" data-categoria="${cat.clave}" data-dia="${dia}" placeholder="—"></textarea>`
      );
    }
  }
  $('rutina-grid').innerHTML = celdas.join('');
  document.querySelectorAll('.rutina-celda').forEach((ta) => {
    ta.addEventListener('blur', () => guardarCeldaRutina(ta));
    ta.addEventListener('input', () => autoAlturaRutina(ta));
  });
  grillaRutinasConstruida = true;
}

// Todos los lunes cuyo lunes cae dentro del mes/año dados — así las semanas
// se agrupan por mes calendario en vez de una ventana móvil desde hoy.
function lunesDelMes(anio, mes) {
  const lunes = lunesDe(new Date(anio, mes, 1));
  if (lunes.getMonth() !== mes) lunes.setDate(lunes.getDate() + 7);
  const resultado = [];
  while (lunes.getMonth() === mes && lunes.getFullYear() === anio) {
    resultado.push(new Date(lunes));
    lunes.setDate(lunes.getDate() + 7);
  }
  return resultado;
}

async function mostrarRutinas() {
  const hoy = new Date();
  const semanas = lunesDelMes(hoy.getFullYear(), hoy.getMonth());

  $('rutina-tabs').innerHTML = semanas
    .map(
      (lunes, i) =>
        `<button type="button" class="rutina-tab" data-semana="${fechaISO(lunes)}">Semana ${i + 1} (${lunes.toLocaleDateString('es-AR')})</button>`
    )
    .join('');

  // Si la semana elegida no pertenece más al mes en pantalla (p.ej. cambió
  // el mes desde la última visita), volvemos a la semana de hoy.
  if (!semanaRutinaActual || !semanas.some((l) => fechaISO(l) === semanaRutinaActual)) {
    const lunesHoy = lunesDe(hoy);
    const semanaHoy = semanas.find((l) => fechaISO(l) === fechaISO(lunesHoy));
    semanaRutinaActual = fechaISO(semanaHoy || semanas[0]);
  }
  if (!grillaRutinasConstruida) construirGrillaRutinas();

  await cargarRutinas();
}

$('rutina-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.rutina-tab');
  if (!btn) return;
  semanaRutinaActual = btn.dataset.semana;
  cargarRutinas();
});

async function cargarRutinas() {
  $('error-rutinas').textContent = '';
  document.querySelectorAll('.rutina-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.semana === semanaRutinaActual);
  });

  const { data, error } = await sb
    .from('rutinas')
    .select('categoria, dia_semana, contenido')
    .eq('tenant_id', staffActual.tenant_id)
    .eq('semana_inicio', semanaRutinaActual);
  if (error) return mostrarError('error-rutinas', error);

  const mapa = {};
  for (const r of data) mapa[`${r.categoria}|${r.dia_semana}`] = r.contenido;

  document.querySelectorAll('.rutina-celda').forEach((ta) => {
    const valor = mapa[`${ta.dataset.categoria}|${ta.dataset.dia}`] || '';
    ta.value = valor;
    ta.dataset.ultimoGuardado = valor;
    autoAlturaRutina(ta); // el value seteado por JS no dispara 'input'
  });
}

async function guardarCeldaRutina(ta) {
  if (ta.value === ta.dataset.ultimoGuardado) return; // sin cambios, no pega al servidor
  const { error } = await sb
    .from('rutinas')
    .upsert(
      {
        tenant_id: staffActual.tenant_id,
        semana_inicio: semanaRutinaActual,
        categoria: ta.dataset.categoria,
        dia_semana: Number(ta.dataset.dia),
        contenido: ta.value,
        actualizado_por: staffActual.id,
      },
      { onConflict: 'tenant_id,semana_inicio,categoria,dia_semana' }
    );
  if (error) return mostrarError('error-rutinas', error);
  ta.dataset.ultimoGuardado = ta.value;
}
*/

// ============================================================
// Arranque
// ============================================================
iniciarApp();

// El indicador del menú necesita que la app ya esté visible para medir los botones.
[150, 600, 1500, 2800].forEach((ms) => setTimeout(posicionarIndicador, ms));
