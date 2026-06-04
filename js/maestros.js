/**
 * maestros.js — CRUD de Materiales, Áreas, Responsables y Clasificadores
 * Sistema Logístico de Almacén Municipal
 */

const Maestros = (() => {
  const SEED_KEY = 'almacen_maestros_datos_v2';
  function buildUnidadOptions(selected) {
    const units = [...UNIDADES];
    if (selected && !units.includes(selected)) units.unshift(selected);
    return units.map((u) =>
      `<option value="${u}" ${selected === u ? 'selected' : ''}>${u}</option>`
    ).join('');
  }

  let activeTab = 'materiales';
  let deleteCallback = null;
  let initialized = false;

  const UNIDADES = ['Unidad', 'Caja', 'Paquete', 'Resma', 'Pliego', 'Rollo', 'Par'];

  const AREAS_MUNICIPALES = [
    'SUB GERENCIA ABASTECIMIENTOS',
    'GERENCIA ASESORIA LEGAL',
    'SUB GERENCIA CATASTRO',
    'SUB GERENCIA CONTABILIDAD',
    'DESARROLLO ECONOMICO',
    'DESARROLLO SOCIAL',
    'ESTUDIOS Y PROYECTOS',
    'FISCALIZACION',
    'GERENCIA MUNICIPAL',
    'SUB GERENCIA IMAGEN',
    'SUB GERENCIA INFORMATICA',
    'INFRAESTRUCTURA',
    'GERENCIA PRESUPUESTO',
    'SUB GERENCIA PROCURADURIA',
    'SUB GERENCIA RECURSOS HUMANOS',
  ];

  const RESPONSABLES_SEED = [
    { nombres: 'MAG.', apellidos: 'FRANCO', dni: '10234567' },
    { nombres: 'ABOG.', apellidos: 'MARIELA', dni: '10345678' },
    { nombres: 'ING. MARCO', apellidos: 'MEDINA', dni: '10456789' },
    { nombres: 'CPC.', apellidos: 'MARTINEZ', dni: '10567890' },
    { nombres: 'ECO.', apellidos: 'YAMUNAQUE', dni: '10678901' },
    { nombres: 'MAG.', apellidos: 'ANTON', dni: '10789012' },
    { nombres: 'ING.', apellidos: 'GALARZA', dni: '10890123' },
    { nombres: 'ING.', apellidos: 'CESAR', dni: '10901234' },
    { nombres: 'ABOG.', apellidos: 'YARLEQUE', dni: '11012345' },
    { nombres: 'JAVIER', apellidos: '—', dni: '11123456' },
    { nombres: 'ING.', apellidos: 'CELIA', dni: '11234567' },
    { nombres: 'ING. MEDINA', apellidos: 'MM', dni: '11345678' },
    { nombres: 'CPC.', apellidos: 'FLOR', dni: '11456789' },
    { nombres: 'LUIS A.', apellidos: 'ROBLES S', dni: '11567890' },
    { nombres: 'DOMINGO', apellidos: '—', dni: '11678901' },
  ];

  const CLASIFICADORES_SEED = [
    'UTILES DE ESCRITORIO',
    'UTILES DE LIMPIEZA',
    'MATERIALES DE COMPUTO',
    'MATERIALES DE CONSTRUCCION',
    'OTROS',
  ];

  /* ── Utilidades ── */

  function isAdmin() {
    const session = Auth.getSession();
    return session?.rolKey === 'admin';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function nextId(items) {
    return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
  }

  function nextCodigo(prefix, items) {
    let max = 0;
    items.forEach((item) => {
      const codigo = item.codigo || '';
      const match = codigo.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
      if (match) max = Math.max(max, parseInt(match[1], 10));
      const alt = codigo.match(/^AR-(\d+)$/i);
      if (prefix === 'ARE' && alt) max = Math.max(max, parseInt(alt[1], 10));
    });
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  }

  function nextNumeroClasificador(items) {
    return items.reduce((max, item) => Math.max(max, item.numero || item.id || 0), 0) + 1;
  }

  function getResponsablePorArea(areaId) {
    const responsables = App.getData('responsables');
    const r = responsables.find((res) => res.areaId === areaId && res.activo !== false);
    if (!r) return 'Sin asignar';
    const ap = r.apellidos && r.apellidos !== '—' ? ` ${r.apellidos}` : '';
    return `${r.nombres}${ap}`.trim();
  }

  function getAreaNombre(areaId) {
    const areas = App.getData('areas');
    const area = areas.find((a) => a.id === areaId);
    return area ? area.nombre : 'Sin área';
  }

  function showToast(message) {
    const toast = document.getElementById('maestros-toast');
    const msg = document.getElementById('maestros-toast-msg');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  /* ── Seed de datos municipales ── */

  function ensureMaestrosSeed() {
    localStorage.removeItem('almacen_maestros_datos_v2');

    const areas = [
      'SUB GERENCIA ABASTECIMIENTOS','GERENCIA ASESORIA LEGAL','SUB GERENCIA CATASTRO',
      'SUB GERENCIA CONTABILIDAD','DESARROLLO ECONOMICO','DESARROLLO SOCIAL',
      'ESTUDIOS Y PROYECTOS','FISCALIZACION','GERENCIA MUNICIPAL','SUB GERENCIA IMAGEN',
      'SUB GERENCIA INFORMATICA','INFRAESTRUCTURA','GERENCIA PRESUPUESTO',
      'SUB GERENCIA PROCURADURIA','SUB GERENCIA RECURSOS HUMANOS'
    ].map((nombre, i) => ({ id: i+1, codigo: `ARE-${String(i+1).padStart(3,'0')}`, nombre, activo: true }));

    const responsables = [
      'MAG. FRANCO','ABOG. MARIELA','ING. MARCO MEDINA','CPC. MARTINEZ','ECO. YAMUNAQUE',
      'MAG. ANTON','ING. GALARZA','ING. CESAR','ABOG. YARLEQUE','JAVIER',
      'ING. CELIA','ING. MEDINA MM','CPC. FLOR','LUIS A. ROBLES S','DOMINGO'
    ].map((nombre, i) => ({ id: i+1, codigo: `RES-${String(i+1).padStart(3,'0')}`, nombres: nombre, apellidos: '', dni: `1000000${i+1}`, areaId: i+1, activo: true }));

    const clasificadores = [
      'UTILES DE ESCRITORIO','UTILES DE LIMPIEZA','MATERIALES DE COMPUTO',
      'MATERIALES DE CONSTRUCCION','OTROS'
    ].map((detalle, i) => ({ id: i+1, numero: i+1, codigo: `CL-${String(i+1).padStart(3,'0')}`, detalle, nombre: detalle }));

    App.setData('areas', areas);
    App.setData('responsables', responsables);
    App.setData('clasificadores', clasificadores);
    localStorage.setItem('almacen_maestros_datos_v2', 'true');
  }

  /* ── Modales ── */

  function openModal(title, formHtml) {
    document.getElementById('maestros-modal-title').textContent = title;
    document.getElementById('maestros-form').innerHTML = formHtml;
    document.getElementById('maestros-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('maestros-modal').classList.add('hidden');
    document.getElementById('maestros-form').innerHTML = '';
  }

  function openDeleteModal(message, onConfirm) {
    document.getElementById('maestros-delete-msg').textContent = message;
    deleteCallback = onConfirm;
    document.getElementById('maestros-delete-modal').classList.remove('hidden');
  }

  function closeDeleteModal() {
    document.getElementById('maestros-delete-modal').classList.add('hidden');
    deleteCallback = null;
  }

  function formActions(submitLabel) {
    return `
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" id="form-cancel"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
          Cancelar
        </button>
        <button type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition">
          ${submitLabel}
        </button>
      </div>`;
  }

  function bindFormCancel() {
    document.getElementById('form-cancel')?.addEventListener('click', closeModal);
  }

  /* ── Pestañas ── */

  function switchTab(tab) {
    const root = document.getElementById('maestros-module');
    if (!root) return;

    activeTab = tab;
    root.querySelectorAll('.maestros-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    root.querySelectorAll('.maestros-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== `panel-${tab}`);
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'materiales': renderMateriales(); break;
      case 'areas': renderAreas(); break;
      case 'responsables': renderResponsables(); break;
      case 'clasificadores': renderClasificadores(); break;
    }
  }

  /* ── MATERiales CRUD ── */

  function renderMateriales() {
    const query = (document.getElementById('search-materiales')?.value || '').toLowerCase().trim();
    const materiales = App.getData('materiales').filter((m) => {
      if (!query) return true;
      return m.nombre.toLowerCase().includes(query) || m.codigo.toLowerCase().includes(query);
    });

    const tbody = document.getElementById('tbody-materiales');
    const empty = document.getElementById('empty-materiales');
    if (!tbody) return;

    if (materiales.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = materiales.map((m) => `
      <tr>
        <td class="codigo-cell">${escapeHtml(m.codigo)}</td>
        <td>${escapeHtml(m.nombre)}</td>
        <td>${escapeHtml(m.unidad)}</td>
        <td class="text-right font-medium ${m.stock <= (m.stockMinimo || 0) ? 'text-red-600' : ''}">${m.stock}</td>
        <td class="text-center">
          <button type="button" class="maestros-btn-icon maestros-btn-edit" data-action="edit-material" data-id="${m.id}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button type="button" class="maestros-btn-icon maestros-btn-delete" data-action="delete-material" data-id="${m.id}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');
  }

  function openMaterialForm(material = null) {
    const materiales = App.getData('materiales');
    const isEdit = !!material;
    const codigo = isEdit ? material.codigo : nextCodigo('MAT', materiales);
    const unidadOptions = buildUnidadOptions(material?.unidad || 'Unidad');

    openModal(isEdit ? 'Editar Material' : 'Nuevo Material', `
      <div class="maestros-field">
        <label for="mat-codigo">Código</label>
        <input type="text" id="mat-codigo" value="${escapeHtml(codigo)}" readonly>
      </div>
      <div class="maestros-field">
        <label for="mat-nombre">Nombre / Detalle</label>
        <input type="text" id="mat-nombre" value="${escapeHtml(material?.nombre || '')}" required placeholder="Descripción del material">
      </div>
      <div class="maestros-field">
        <label for="mat-unidad">Unidad de Medida</label>
        <select id="mat-unidad" required>${unidadOptions}</select>
      </div>
      ${formActions(isEdit ? 'Guardar cambios' : 'Registrar material')}
    `);

    bindFormCancel();
    document.getElementById('maestros-form').onsubmit = (e) => {
      e.preventDefault();
      const nombre = document.getElementById('mat-nombre').value.trim();
      const unidad = document.getElementById('mat-unidad').value;
      if (!nombre) return;

      const list = App.getData('materiales');
      if (isEdit) {
        const idx = list.findIndex((m) => m.id === material.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], nombre, unidad };
          App.setData('materiales', list);
          showToast('Material actualizado correctamente.');
        }
      } else {
        list.push({
          id: nextId(list),
          codigo,
          nombre,
          unidad,
          stock: 0,
          stockMinimo: 10,
          areaId: 1,
          clasificador: 'OTROS',
          activo: true,
        });
        App.setData('materiales', list);
        showToast('Material registrado correctamente.');
      }
      closeModal();
      renderMateriales();
    };
  }

  function deleteMaterial(id) {
    const list = App.getData('materiales');
    const item = list.find((m) => m.id === id);
    if (!item) return;
    openDeleteModal(`¿Está seguro de eliminar el material "${item.nombre}" (${item.codigo})?`, () => {
      App.setData('materiales', list.filter((m) => m.id !== id));
      showToast('Material eliminado correctamente.');
      renderMateriales();
    });
  }

  /* ── ÁREAS CRUD ── */

  function renderAreas() {
    const query = (document.getElementById('search-areas')?.value || '').toLowerCase().trim();
    const areas = App.getData('areas').filter((a) => {
      if (!query) return true;
      return a.nombre.toLowerCase().includes(query) || a.codigo.toLowerCase().includes(query);
    });

    const tbody = document.getElementById('tbody-areas');
    const empty = document.getElementById('empty-areas');
    if (!tbody) return;

    if (areas.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = areas.map((a) => `
      <tr>
        <td class="codigo-cell">${escapeHtml(a.codigo)}</td>
        <td>${escapeHtml(a.nombre)}</td>
        <td class="text-slate-600">${escapeHtml(getResponsablePorArea(a.id))}</td>
        <td class="text-center">
          <button type="button" class="maestros-btn-icon maestros-btn-edit" data-action="edit-area" data-id="${a.id}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button type="button" class="maestros-btn-icon maestros-btn-delete" data-action="delete-area" data-id="${a.id}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');
  }

  function openAreaForm(area = null) {
    const areas = App.getData('areas');
    const isEdit = !!area;
    const codigo = isEdit ? area.codigo : nextCodigo('ARE', areas);

    openModal(isEdit ? 'Editar Área' : 'Nueva Área', `
      <div class="maestros-field">
        <label for="area-codigo">Código</label>
        <input type="text" id="area-codigo" value="${escapeHtml(codigo)}" readonly>
      </div>
      <div class="maestros-field">
        <label for="area-nombre">Nombre del Área</label>
        <input type="text" id="area-nombre" value="${escapeHtml(area?.nombre || '')}" required placeholder="Nombre del área usuaria">
      </div>
      ${formActions(isEdit ? 'Guardar cambios' : 'Registrar área')}
    `);

    bindFormCancel();
    document.getElementById('maestros-form').onsubmit = (e) => {
      e.preventDefault();
      const nombre = document.getElementById('area-nombre').value.trim();
      if (!nombre) return;

      const list = App.getData('areas');
      if (isEdit) {
        const idx = list.findIndex((a) => a.id === area.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], nombre };
          App.setData('areas', list);
          showToast('Área actualizada correctamente.');
        }
      } else {
        list.push({ id: nextId(list), codigo, nombre, activo: true });
        App.setData('areas', list);
        showToast('Área registrada correctamente.');
      }
      closeModal();
      renderAreas();
    };
  }

  function deleteArea(id) {
    const list = App.getData('areas');
    const item = list.find((a) => a.id === id);
    if (!item) return;
    openDeleteModal(`¿Está seguro de eliminar el área "${item.nombre}" (${item.codigo})?`, () => {
      App.setData('areas', list.filter((a) => a.id !== id));
      showToast('Área eliminada correctamente.');
      renderAreas();
    });
  }

  /* ── RESPONSABLES CRUD ── */

  function renderResponsables() {
    const query = (document.getElementById('search-responsables')?.value || '').toLowerCase().trim();
    const responsables = App.getData('responsables').filter((r) => {
      if (!query) return true;
      const full = `${r.nombres} ${r.apellidos} ${r.dni} ${r.codigo}`.toLowerCase();
      return full.includes(query);
    });

    const tbody = document.getElementById('tbody-responsables');
    const empty = document.getElementById('empty-responsables');
    if (!tbody) return;

    if (responsables.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = responsables.map((r) => `
      <tr>
        <td class="codigo-cell">${escapeHtml(r.codigo)}</td>
        <td>${escapeHtml(r.nombres)}</td>
        <td>${escapeHtml(r.apellidos)}</td>
        <td class="font-mono text-xs">${escapeHtml(r.dni)}</td>
        <td>${escapeHtml(getAreaNombre(r.areaId))}</td>
        <td class="text-center">
          <button type="button" class="maestros-btn-icon maestros-btn-edit" data-action="edit-responsable" data-id="${r.id}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button type="button" class="maestros-btn-icon maestros-btn-delete" data-action="delete-responsable" data-id="${r.id}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');
  }

  function buildAreaOptions(selectedId) {
    return App.getData('areas').map((a) =>
      `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${escapeHtml(a.nombre)}</option>`
    ).join('');
  }

  function openResponsableForm(responsable = null) {
    const responsables = App.getData('responsables');
    const isEdit = !!responsable;
    const codigo = isEdit ? responsable.codigo : nextCodigo('RES', responsables);
    const areas = App.getData('areas');

    openModal(isEdit ? 'Editar Responsable' : 'Nuevo Responsable', `
      <div class="maestros-field">
        <label for="res-codigo">Código</label>
        <input type="text" id="res-codigo" value="${escapeHtml(codigo)}" readonly>
      </div>
      <div class="maestros-field">
        <label for="res-nombres">Nombres</label>
        <input type="text" id="res-nombres" value="${escapeHtml(responsable?.nombres || '')}" required placeholder="Nombres o título">
      </div>
      <div class="maestros-field">
        <label for="res-apellidos">Apellidos</label>
        <input type="text" id="res-apellidos" value="${escapeHtml(responsable?.apellidos || '')}" required placeholder="Apellidos">
      </div>
      <div class="maestros-field">
        <label for="res-dni">DNI</label>
        <input type="text" id="res-dni" value="${escapeHtml(responsable?.dni || '')}" required maxlength="8" pattern="[0-9]{8}" placeholder="8 dígitos">
      </div>
      <div class="maestros-field">
        <label for="res-area">Área Asignada</label>
        <select id="res-area" required>
          <option value="">Seleccione un área</option>
          ${buildAreaOptions(responsable?.areaId || areas[0]?.id)}
        </select>
      </div>
      ${formActions(isEdit ? 'Guardar cambios' : 'Registrar responsable')}
    `);

    bindFormCancel();
    document.getElementById('maestros-form').onsubmit = (e) => {
      e.preventDefault();
      const nombres = document.getElementById('res-nombres').value.trim();
      const apellidos = document.getElementById('res-apellidos').value.trim();
      const dni = document.getElementById('res-dni').value.trim();
      const areaId = parseInt(document.getElementById('res-area').value, 10);
      if (!nombres || !apellidos || !dni || !areaId) return;

      const list = App.getData('responsables');
      if (isEdit) {
        const idx = list.findIndex((r) => r.id === responsable.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], nombres, apellidos, dni, areaId };
          App.setData('responsables', list);
          showToast('Responsable actualizado correctamente.');
        }
      } else {
        list.push({ id: nextId(list), codigo, nombres, apellidos, dni, areaId, activo: true });
        App.setData('responsables', list);
        showToast('Responsable registrado correctamente.');
      }
      closeModal();
      renderResponsables();
      if (activeTab === 'areas') renderAreas();
    };
  }

  function deleteResponsable(id) {
    const list = App.getData('responsables');
    const item = list.find((r) => r.id === id);
    if (!item) return;
    openDeleteModal(`¿Está seguro de eliminar al responsable ${item.nombres} ${item.apellidos}?`, () => {
      App.setData('responsables', list.filter((r) => r.id !== id));
      showToast('Responsable eliminado correctamente.');
      renderResponsables();
      if (activeTab === 'areas') renderAreas();
    });
  }

  /* ── CLASIFICADORES CRUD ── */

  function getClasificadorDetalle(c) {
    return c.detalle || c.nombre || c.descripcion || '';
  }

  function renderClasificadores() {
    const query = (document.getElementById('search-clasificadores')?.value || '').toLowerCase().trim();
    const clasificadores = App.getData('clasificadores').filter((c) => {
      const detalle = getClasificadorDetalle(c).toLowerCase();
      if (!query) return true;
      return detalle.includes(query) || String(c.numero || c.id).includes(query);
    });

    const tbody = document.getElementById('tbody-clasificadores');
    const empty = document.getElementById('empty-clasificadores');
    if (!tbody) return;

    if (clasificadores.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = clasificadores.map((c) => `
      <tr>
        <td class="font-medium">${String(c.numero || c.id).padStart(2, '0')}</td>
        <td>${escapeHtml(getClasificadorDetalle(c))}</td>
        <td class="text-center">
          <button type="button" class="maestros-btn-icon maestros-btn-edit" data-action="edit-clasificador" data-id="${c.id}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button type="button" class="maestros-btn-icon maestros-btn-delete" data-action="delete-clasificador" data-id="${c.id}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');
  }

  function openClasificadorForm(clasificador = null) {
    const clasificadores = App.getData('clasificadores');
    const isEdit = !!clasificador;
    const numero = isEdit ? (clasificador.numero || clasificador.id) : nextNumeroClasificador(clasificadores);
    const detalle = isEdit ? getClasificadorDetalle(clasificador) : '';

    openModal(isEdit ? 'Editar Clasificador' : 'Nuevo Clasificador', `
      <div class="maestros-field">
        <label for="clf-numero">N° Clasificador</label>
        <input type="text" id="clf-numero" value="${numero}" readonly>
      </div>
      <div class="maestros-field">
        <label for="clf-detalle">Detalle</label>
        <input type="text" id="clf-detalle" value="${escapeHtml(detalle)}" required placeholder="Descripción del clasificador">
      </div>
      ${formActions(isEdit ? 'Guardar cambios' : 'Registrar clasificador')}
    `);

    bindFormCancel();
    document.getElementById('maestros-form').onsubmit = (e) => {
      e.preventDefault();
      const det = document.getElementById('clf-detalle').value.trim();
      if (!det) return;

      const list = App.getData('clasificadores');
      if (isEdit) {
        const idx = list.findIndex((c) => c.id === clasificador.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], detalle: det, nombre: det, descripcion: det };
          App.setData('clasificadores', list);
          showToast('Clasificador actualizado correctamente.');
        }
      } else {
        const num = nextNumeroClasificador(list);
        list.push({
          id: nextId(list),
          numero: num,
          codigo: `CL-${String(num).padStart(3, '0')}`,
          detalle: det,
          nombre: det,
          descripcion: det,
        });
        App.setData('clasificadores', list);
        showToast('Clasificador registrado correctamente.');
      }
      closeModal();
      renderClasificadores();
    };
  }

  function deleteClasificador(id) {
    const list = App.getData('clasificadores');
    const item = list.find((c) => c.id === id);
    if (!item) return;
    openDeleteModal(`¿Está seguro de eliminar el clasificador "${getClasificadorDetalle(item)}"?`, () => {
      App.setData('clasificadores', list.filter((c) => c.id !== id));
      showToast('Clasificador eliminado correctamente.');
      renderClasificadores();
    });
  }

  /* ── Eventos ── */

  function bindEvents() {
    const module = document.getElementById('maestros-module');
    if (!module || module.dataset.bound === 'true') return;
    module.dataset.bound = 'true';

    document.getElementById('search-materiales')?.addEventListener('input', renderMateriales);
    document.getElementById('search-areas')?.addEventListener('input', renderAreas);
    document.getElementById('search-responsables')?.addEventListener('input', renderResponsables);
    document.getElementById('search-clasificadores')?.addEventListener('input', renderClasificadores);

    document.getElementById('btn-nuevo-material')?.addEventListener('click', () => openMaterialForm());
    document.getElementById('btn-nueva-area')?.addEventListener('click', () => openAreaForm());
    document.getElementById('btn-nuevo-responsable')?.addEventListener('click', () => openResponsableForm());
    document.getElementById('btn-nuevo-clasificador')?.addEventListener('click', () => openClasificadorForm());

    document.getElementById('maestros-modal-close')?.addEventListener('click', closeModal);
    document.querySelector('#maestros-modal .maestros-modal-backdrop')?.addEventListener('click', closeModal);

    document.getElementById('maestros-delete-cancel')?.addEventListener('click', closeDeleteModal);
    document.querySelector('#maestros-delete-modal .maestros-modal-backdrop')?.addEventListener('click', closeDeleteModal);
    document.getElementById('maestros-delete-confirm')?.addEventListener('click', () => {
      if (deleteCallback) deleteCallback();
      closeDeleteModal();
    });

    module.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.maestros-tab');
      if (tabBtn?.dataset.tab) {
        switchTab(tabBtn.dataset.tab);
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = parseInt(btn.dataset.id, 10);
      const action = btn.dataset.action;

      switch (action) {
        case 'edit-material': {
          const m = App.getData('materiales').find((x) => x.id === id);
          if (m) openMaterialForm(m);
          break;
        }
        case 'delete-material':
          deleteMaterial(id);
          break;
        case 'edit-area': {
          const a = App.getData('areas').find((x) => x.id === id);
          if (a) openAreaForm(a);
          break;
        }
        case 'delete-area':
          deleteArea(id);
          break;
        case 'edit-responsable': {
          const r = App.getData('responsables').find((x) => x.id === id);
          if (r) openResponsableForm(r);
          break;
        }
        case 'delete-responsable':
          deleteResponsable(id);
          break;
        case 'edit-clasificador': {
          const c = App.getData('clasificadores').find((x) => x.id === id);
          if (c) openClasificadorForm(c);
          break;
        }
        case 'delete-clasificador':
          deleteClasificador(id);
          break;
      }
    });
  }

  /* ── Inicialización ── */

  function init() {
    console.log("Maestros.init() called!");
    const module = document.getElementById('maestros-module');
    console.log("Maestros module element:", module);
    if (!module) return;

    ensureMaestrosSeed();

    const denied = document.getElementById('maestros-denied');
    const content = document.getElementById('maestros-content');

    if (!Auth.hasPermission('maestros')) {
      denied?.classList.remove('hidden');
      content?.classList.add('hidden');
      return;
    }

    denied?.classList.add('hidden');
    content?.classList.remove('hidden');

    bindEvents();
    activeTab = 'materiales';
    switchTab('materiales');
    initialized = true;
  }

  return { init };
})();

window.Maestros = Maestros;
