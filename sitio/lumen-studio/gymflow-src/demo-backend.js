// GymFlow — backend de demostración 100% en memoria.
// Reemplaza a Supabase: mismos nombres de tablas/RPC que usa la app, con datos
// de ejemplo ficticios generados relativos a la fecha de hoy (así la demo
// siempre se ve "viva"). Todo vive en el navegador y se reinicia al recargar.

(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoy0 = new Date();
  hoy0.setHours(0, 0, 0, 0);
  const hoyISO = () => isoDate(new Date());
  const fecha = (offset) => {
    const d = new Date(hoy0);
    d.setDate(d.getDate() + offset);
    return isoDate(d);
  };
  const sumarDias = (iso, dias) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + dias);
    return isoDate(d);
  };
  const diasEntre = (desdeISO, hastaISO) =>
    Math.round((new Date(`${hastaISO}T00:00:00`) - new Date(`${desdeISO}T00:00:00`)) / 86400000);
  // "Hace X minutos", pero sin cruzar a ayer: los movimientos de hoy siempre quedan con fecha de hoy.
  const hace = (minutos) => {
    const d = new Date(Date.now() - minutos * 60000);
    return (d < hoy0 ? new Date(hoy0.getTime() + minutos * 1000) : d).toISOString();
  };
  const tsDia = (offset, hora, min = 0) => {
    const d = new Date(hoy0);
    d.setDate(d.getDate() + offset);
    d.setHours(hora, min, 0, 0);
    return d.toISOString();
  };

  let seq = 0;
  const uid = (prefijo) => `${prefijo}-${++seq}`;
  const clonar = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
  const esperar = () => new Promise((r) => setTimeout(r, 60));

  const TENANT_ID = 'demo-gimnasio';
  const STAFF = { id: 'demo-staff', tenant_id: TENANT_ID, nombre: 'Demo', rol: 'owner' };

  const db = { planes: [], socios: [], membresias: [], pagos: [], gastos: [], turnos_fijos: [] };

  // ------------------------------------------------------------
  // Datos de ejemplo
  // ------------------------------------------------------------
  db.planes.push(
    { id: 'plan-mensual', tenant_id: TENANT_ID, codigo: 'MEN', nombre: 'Mensual', precio: 28000, duracion_dias: 30, cantidad_turnos: null, activo: true },
    { id: 'plan-trim', tenant_id: TENANT_ID, codigo: 'TRIM', nombre: 'Trimestral', precio: 75000, duracion_dias: 90, cantidad_turnos: null, activo: true },
    { id: 'plan-anual', tenant_id: TENANT_ID, codigo: 'ANUAL', nombre: 'Anual', precio: 260000, duracion_dias: 365, cantidad_turnos: null, activo: true }
  );

  // [nombre, celular, plan, días hasta el vencimiento, clases usadas, pago ('total' | fracción), método, extra]
  const SOCIOS_SEMILLA = [
    ['Valentina Ríos', '11 5012 3401', 'plan-mensual', 24, 0, 'total', 'transferencia'],
    ['Mateo Fernández', '11 5127 8845', 'plan-anual', 18, 0, 'total', 'efectivo'],
    ['Camila Sosa', '11 5233 1920', 'plan-mensual', 30, 0, 'total', 'transferencia'],
    ['Lucas Benítez', '11 5348 6672', 'plan-anual', 2, 0, 'total', 'efectivo'],
    ['Sofía Aguirre', '11 5461 0058', 'plan-trim', 61, 0, 'total', 'transferencia'],
    ['Joaquín Medina', '11 5579 4416', 'plan-trim', 9, 0, 'total', 'efectivo'],
    ['Martina Cabrera', '11 5684 2237', 'plan-anual', 15, 0, 'total', 'transferencia'],
    ['Tomás Herrera', '11 5792 9503', 'plan-mensual', -6, 0, 'total', 'efectivo'],
    ['Julieta Domínguez', '11 5806 7714', 'plan-trim', 27, 0, 'total', 'transferencia'],
    ['Nicolás Paz', '11 5915 3380', 'plan-mensual', 1, 0, 'total', 'efectivo'],
    ['Agustina Luna', '11 6023 5561', 'plan-anual', 21, 0, 0.5, 'transferencia'],
    ['Facundo Ibarra', '11 6138 1249', 'plan-trim', -3, 0, 'total', 'efectivo'],
    ['Lucía Acosta', '11 6247 8806', 'plan-mensual', 12, 0, 'total', 'transferencia'],
    ['Santiago Molina', '11 6359 4472', 'plan-trim', 44, 0, 'total', 'transferencia'],
    ['Florencia Giménez', '11 6461 7095', 'plan-trim', 3, 0, 'total', 'efectivo'],
    ['Bruno Castro', '11 6574 2318', 'plan-mensual', 29, 0, 'total', 'transferencia'],
    ['Micaela Romero', '11 6682 6643', 'plan-anual', -12, 0, 'total', 'efectivo'],
    ['Ignacio Vega', '11 6795 0927', 'plan-trim', 20, 0, 0.6, 'efectivo'],
    ['Carolina Peralta', '11 6807 5184', 'plan-mensual', 8, 0, 'total', 'transferencia'],
    ['Emiliano Suárez', '11 6914 3760', 'plan-mensual', 30, 0, 'total', 'efectivo'],
    ['Daniela Ortiz', '11 7026 8452', 'plan-trim', 25, 0, 'total', 'transferencia'],
    ['Franco Navarro', '11 7139 1603', 'plan-anual', -20, 0, 'total', 'efectivo'],
    ['Rocío Maldonado', '11 7241 9378', 'plan-mensual', 30, 0, 'total', 'transferencia'],
    ['Gonzalo Figueroa', '11 7352 4025', 'plan-mensual', 17, 0, 0.5, 'efectivo'],
    ['Abril Campos', '11 7468 6891', 'plan-anual', 30, 0, 'total', 'efectivo'],
    ['Dante Rojas', '11 7573 2114', 'plan-mensual', 2, 0, 'total', 'transferencia'],
  ];
  // Altas por mes (hace cuántos días se dio de alta cada socio) para que el gráfico del Dashboard tenga forma.
  const ANTIGUEDAD_DIAS = [
    150, 140, 128, 118, 108, 99, 92, 85, 79, 71, 66, 60, 54, 48, 42, 37, 31, 26, 21, 17, 12, 9, 6, 4, 2, 1,
  ];

  SOCIOS_SEMILLA.forEach(([nombre, celular, planId, vence, usadas, pago, metodo], i) => {
    const plan = db.planes.find((p) => p.id === planId);
    const socioId = uid('socio');
    db.socios.push({
      id: socioId,
      tenant_id: TENANT_ID,
      codigo: `GF-${String(i + 1).padStart(3, '0')}`,
      nombre,
      celular,
      email: `${nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@ejemplo.com`,
      inactivo: false,
      created_at: tsDia(-ANTIGUEDAD_DIAS[i], 11),
    });

    const fin = fecha(vence);
    const inicio = sumarDias(fin, -plan.duracion_dias);
    const membresiaId = uid('mem');
    db.membresias.push({
      id: membresiaId,
      tenant_id: TENANT_ID,
      socio_id: socioId,
      plan_id: planId,
      fecha_inicio: inicio,
      fecha_fin: fin,
      estado: 'activa',
      precio_lista: plan.precio,
      descuento_pct: 0,
      descuento_meses_restantes: 0,
      precio_final: plan.precio,
      clases_consumidas: plan.cantidad_turnos ? usadas : 0,
    });

    const monto = pago === 'total' ? plan.precio : Math.round(plan.precio * pago);
    // Los movimientos del día de hoy llevan hora reciente para que Caja se vea con actividad al abrirla.
    const cobradoHoy = inicio === hoyISO();
    db.pagos.push({
      id: uid('pago'),
      tenant_id: TENANT_ID,
      membresia_id: membresiaId,
      monto,
      tipo: 'pago',
      metodo_pago: metodo,
      fecha_pago: inicio,
      created_at: cobradoHoy ? hace(25 + i * 17) : tsDia(diasEntre(hoyISO(), inicio), 9 + (i % 9), (i * 7) % 60),
      anulado_en: null,
    });
  });

  // Un socio inactivo y uno dado de alta sin cobro (queda sin plan).
  db.socios[19].inactivo = true;
  db.socios.push({
    id: uid('socio'),
    tenant_id: TENANT_ID,
    codigo: 'GF-027',
    nombre: 'Pilar Quiroga',
    celular: '11 7684 5530',
    email: 'pilar@ejemplo.com',
    inactivo: false,
    created_at: tsDia(-3, 15),
  });

  const GASTOS_SEMILLA = [
    ['Alquiler del local', 180000, 'transferencia', -12],
    ['Servicio de luz', 38500, 'transferencia', -9],
    ['Limpieza mensual', 22000, 'efectivo', -5],
    ['Reposición de discos y mancuernas', 64000, 'transferencia', -3],
    ['Agua y bebidas', 9500, 'efectivo', 0],
    ['Mantenimiento de cintas', 35000, null, -2],
    ['Publicidad en redes', 18000, null, -1],
  ];
  GASTOS_SEMILLA.forEach(([concepto, monto, metodo, offset], i) => {
    db.gastos.push({
      id: uid('gasto'),
      tenant_id: TENANT_ID,
      concepto,
      monto,
      metodo_pago: metodo,
      fecha: fecha(offset),
      created_at: offset === 0 ? hace(40) : tsDia(offset, 12, i * 3),
      anulado_en: null,
      motivo_anulacion: null,
    });
  });

  // Turnos fijos: [día (1 = lunes ... 6 = sábado), hora inicio, hora fin, índices de socios]
  const TURNOS_SEMILLA = [
    [1, '08:00:00', '09:00:00', [0, 2, 6]],
    [1, '18:00:00', '19:00:00', [1, 3, 7, 12, 15]],
    [1, '19:00:00', '20:00:00', [4, 8, 10]],
    [2, '09:00:00', '10:00:00', [5, 9]],
    [2, '17:00:00', '18:00:00', [0, 11, 13, 17]],
    [2, '19:00:00', '20:00:00', [2, 14, 16, 18, 20]],
    [3, '08:00:00', '09:00:00', [1, 6, 12]],
    [3, '18:00:00', '19:00:00', [3, 4, 7, 15, 19, 21]],
    [4, '09:00:00', '10:00:00', [8, 10]],
    [4, '17:00:00', '18:00:00', [0, 5, 9, 13]],
    [4, '19:00:00', '20:00:00', [2, 11, 14, 17, 22]],
    [5, '08:00:00', '09:00:00', [1, 6, 16]],
    [5, '18:00:00', '19:00:00', [3, 4, 12, 18, 23]],
    [6, '09:00:00', '13:00:00', [0, 5, 8, 13, 15, 20, 24]],
  ];
  for (const [dia, ini, fin, indices] of TURNOS_SEMILLA) {
    for (const i of indices) {
      db.turnos_fijos.push({
        id: uid('turno'),
        tenant_id: TENANT_ID,
        socio_id: db.socios[i].id,
        dia_semana: dia,
        hora_inicio: ini,
        hora_fin: fin,
        activo: true,
      });
    }
  }

  // ------------------------------------------------------------
  // Vista v_estado_socios (calculada al vuelo)
  // ------------------------------------------------------------
  const membresiaVigente = (socioId) =>
    db.membresias
      .filter((m) => m.socio_id === socioId && m.estado === 'activa')
      .sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin))[0] || null;

  const totalPagado = (membresiaId) =>
    db.pagos
      .filter((p) => p.membresia_id === membresiaId && !p.anulado_en)
      .reduce((acc, p) => acc + (p.tipo === 'reembolso' ? -1 : 1) * Number(p.monto), 0);

  function estadoDe(socio, membresia) {
    if (socio.inactivo) return 'inactivo';
    if (!membresia) return 'vencido';
    const dias = diasEntre(hoyISO(), membresia.fecha_fin);
    if (dias < 0) return 'vencido';
    if (dias <= 3) return 'por_vencer';
    return 'activo';
  }

  function vistaEstadoSocios() {
    return db.socios.map((s) => {
      const m = membresiaVigente(s.id);
      const plan = m ? db.planes.find((p) => p.id === m.plan_id) : null;
      const conPaquete = plan && plan.cantidad_turnos != null;
      return {
        socio_id: s.id,
        codigo: s.codigo,
        nombre: s.nombre,
        celular: s.celular,
        email: s.email,
        plan_nombre: plan ? plan.nombre : null,
        estado_socio: estadoDe(s, m),
        fecha_fin: m ? m.fecha_fin : null,
        membresia_id: m ? m.id : null,
        deuda: m ? Math.max(0, m.precio_final - totalPagado(m.id)) : null,
        cantidad_turnos: conPaquete ? plan.cantidad_turnos : null,
        clases_consumidas: conPaquete ? m.clases_consumidas : null,
        clases_restantes: conPaquete ? plan.cantidad_turnos - m.clases_consumidas : null,
      };
    });
  }

  const origen = (tabla) => (tabla === 'v_estado_socios' ? vistaEstadoSocios() : db[tabla]);

  // Relaciones embebidas que pide la app: pagos -> membresias(socios(nombre)) y turnos_fijos -> socios(nombre).
  function conRelaciones(tabla, fila, columnas) {
    if (tabla === 'pagos' && columnas.includes('membresias(')) {
      const m = db.membresias.find((x) => x.id === fila.membresia_id);
      const s = m ? db.socios.find((x) => x.id === m.socio_id) : null;
      return { ...fila, membresias: m ? { socios: s ? { nombre: s.nombre } : null } : null };
    }
    if (tabla === 'turnos_fijos' && columnas.includes('socios(')) {
      const s = db.socios.find((x) => x.id === fila.socio_id);
      return { ...fila, socios: s ? { nombre: s.nombre } : null };
    }
    return fila;
  }

  // ------------------------------------------------------------
  // Mini query builder compatible con la parte de supabase-js que usa la app
  // ------------------------------------------------------------
  function Consulta(tabla) {
    this.tabla = tabla;
    this.operacion = 'select';
    this.columnas = '*';
    this.filtros = [];
    this.orden = [];
    this.unico = false;
    this.datos = null;
  }
  Consulta.prototype = {
    select(columnas) { this.columnas = columnas || '*'; return this; },
    insert(filas) { this.operacion = 'insert'; this.datos = Array.isArray(filas) ? filas : [filas]; return this; },
    update(valores) { this.operacion = 'update'; this.datos = valores; return this; },
    delete() { this.operacion = 'delete'; return this; },
    eq(col, val) { this.filtros.push((f) => f[col] === val); return this; },
    is(col, val) { this.filtros.push((f) => (f[col] ?? null) === val); return this; },
    not(col, op, val) { if (op === 'is') this.filtros.push((f) => (f[col] ?? null) !== val); return this; },
    gte(col, val) { this.filtros.push((f) => f[col] != null && f[col] >= val); return this; },
    lte(col, val) { this.filtros.push((f) => f[col] != null && f[col] <= val); return this; },
    order(col, opciones) { this.orden.push({ col, asc: opciones?.ascending !== false }); return this; },
    single() { this.unico = true; return this; },
    then(ok, fallo) { return this.ejecutar().then(ok, fallo); },

    async ejecutar() {
      await esperar();
      const coincide = (f) => this.filtros.every((fn) => fn(f));
      let filas;

      if (this.operacion === 'insert') {
        filas = this.datos.map((d) => {
          const base = { id: uid(this.tabla), created_at: new Date().toISOString() };
          if (this.tabla === 'pagos') Object.assign(base, { tipo: 'pago', fecha_pago: hoyISO(), anulado_en: null });
          if (this.tabla === 'gastos') Object.assign(base, { anulado_en: null, motivo_anulacion: null });
          if (this.tabla === 'turnos_fijos') base.activo = true;
          const fila = { ...base, ...d };
          db[this.tabla].push(fila);
          return fila;
        });
      } else if (this.operacion === 'update') {
        filas = origen(this.tabla).filter(coincide);
        filas.forEach((f) => Object.assign(f, this.datos));
      } else if (this.operacion === 'delete') {
        filas = origen(this.tabla).filter(coincide);
        db[this.tabla] = db[this.tabla].filter((f) => !filas.includes(f));
      } else {
        filas = origen(this.tabla).filter(coincide);
      }

      for (const { col, asc } of [...this.orden].reverse()) {
        filas = [...filas].sort((a, b) => {
          const x = a[col];
          const y = b[col];
          const c = typeof x === 'string' ? x.localeCompare(y, 'es', { sensitivity: 'base' }) : x - y;
          return asc ? c : -c;
        });
      }

      const resultado = clonar(filas.map((f) => conRelaciones(this.tabla, f, this.columnas)));
      if (this.unico) {
        return resultado.length
          ? { data: resultado[0], error: null }
          : { data: null, error: { message: 'No se encontró el registro.' } };
      }
      return { data: resultado, error: null };
    },
  };

  // ------------------------------------------------------------
  // Funciones RPC (la lógica de negocio que en producción vive en Postgres)
  // ------------------------------------------------------------
  const redondear = (precio, pct) => Math.round(precio * (1 - pct / 100));

  function registrarPagos(membresiaId, efectivo, transferencia) {
    for (const [metodo, monto] of [['efectivo', efectivo], ['transferencia', transferencia]]) {
      if (monto > 0) {
        db.pagos.push({
          id: uid('pago'),
          tenant_id: TENANT_ID,
          membresia_id: membresiaId,
          monto,
          tipo: 'pago',
          metodo_pago: metodo,
          fecha_pago: hoyISO(),
          created_at: new Date().toISOString(),
          anulado_en: null,
        });
      }
    }
  }

  function crearMembresia(socioId, planId, inicio, pct, meses, efectivo, transferencia) {
    const plan = db.planes.find((p) => p.id === planId);
    if (!plan) throw new Error('El plan no existe.');
    const membresia = {
      id: uid('mem'),
      tenant_id: TENANT_ID,
      socio_id: socioId,
      plan_id: planId,
      fecha_inicio: inicio,
      fecha_fin: sumarDias(inicio, plan.duracion_dias),
      estado: 'activa',
      precio_lista: plan.precio,
      descuento_pct: pct || 0,
      descuento_meses_restantes: pct > 0 ? meses || 0 : 0,
      precio_final: redondear(plan.precio, pct || 0),
      clases_consumidas: 0,
    };
    db.membresias.push(membresia);
    registrarPagos(membresia.id, efectivo || 0, transferencia || 0);
    return membresia;
  }

  const RPC = {
    fn_solicitud_socio(p) {
      const socio = {
        id: uid('socio'),
        tenant_id: TENANT_ID,
        codigo: `GF-${String(db.socios.length + 1).padStart(3, '0')}`,
        nombre: p.p_nombre,
        email: p.p_email,
        celular: p.p_celular,
        inactivo: false,
        created_at: new Date().toISOString(),
      };
      db.socios.push(socio);
      if (p.p_plan_id) {
        crearMembresia(socio.id, p.p_plan_id, p.p_fecha_inicio, p.p_descuento_pct, p.p_descuento_meses, p.p_monto_efectivo, p.p_monto_transferencia);
      }
      return socio.id;
    },

    fn_vender_membresia(p) {
      const m = crearMembresia(p.p_socio_id, p.p_plan_id, p.p_fecha_inicio, p.p_descuento_pct, p.p_descuento_meses, p.p_monto_efectivo, p.p_monto_transferencia);
      return m.id;
    },

    fn_renovar_membresia(p) {
      const anterior = db.membresias.find((m) => m.id === p.p_membresia_actual_id);
      if (!anterior) throw new Error('La membresía no existe.');
      const hereda = anterior.descuento_meses_restantes > 1 && anterior.plan_id === p.p_plan_id;
      const inicio = anterior.fecha_fin > hoyISO() ? anterior.fecha_fin : hoyISO();
      const nueva = crearMembresia(
        anterior.socio_id,
        p.p_plan_id,
        inicio,
        hereda ? anterior.descuento_pct : 0,
        hereda ? anterior.descuento_meses_restantes - 1 : 0,
        p.p_monto_efectivo,
        p.p_monto_transferencia
      );
      return nueva.id;
    },

    fn_ajustar_asistencia_clase(p) {
      const m = membresiaVigente(p.p_socio_id);
      const plan = m ? db.planes.find((x) => x.id === m.plan_id) : null;
      if (!m || !plan || plan.cantidad_turnos == null) throw new Error('El socio no tiene un plan por paquete de clases.');
      m.clases_consumidas = Math.min(plan.cantidad_turnos, Math.max(0, m.clases_consumidas + p.p_delta));
      return [{ clases_consumidas: m.clases_consumidas, clases_restantes: plan.cantidad_turnos - m.clases_consumidas }];
    },

    fn_caja_pin_configurado() { return false; },
    fn_verificar_pin_caja() { return true; },
  };

  window.DEMO_STAFF = STAFF;
  window.crearClienteDemo = () => ({
    from: (tabla) => new Consulta(tabla),
    async rpc(nombre, params) {
      await esperar();
      try {
        const fn = RPC[nombre];
        if (!fn) throw new Error(`Función no disponible en la demo: ${nombre}`);
        return { data: clonar(fn(params || {})), error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    },
  });
})();
