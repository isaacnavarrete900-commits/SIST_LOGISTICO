/**
 * salidas.js — Módulo de Papeletas de Salida
 * Sistema Logístico de Almacén Municipal
 */

const Salidas = (() => {
  let rowCount = 0;

  function getSession() {
    return Auth.getSession();
  }

  function getRole() {
    return getSession()?.rolKey || 'asistente';
  }

  function getRoleName() {
    return getSession()?.rol || 'Asistente';
  }

  function getKeeperName() {
    return getSession()?.nombre || 'Encargado de Almacén';
  }

  function showToast(message) {
    const toast = document.getElementById('salidas-toast');
    const msg = document.getElementById('salidas-toast-msg');
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

  function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function nextId(items) {
    return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
  }

  function getNextCorrelativo() {
    const list = App.getData('salidas') || [];
    let max = 0;
    list.forEach(item => {
      const match = (item.correlativo || '').match(/^SALE-(\d+)$/i);
      if (match) {
        max = Math.max(max, parseInt(match[1], 10));
      }
    });
    return `SALE-${String(max + 1).padStart(3, '0')}`;
  }

  function renderTable() {
    const list = App.getData('salidas') || [];
    const tbody = document.getElementById('tbody-salidas');
    const empty = document.getElementById('empty-salidas');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    const sorted = [...list].reverse();
    tbody.innerHTML = sorted.map((s) => `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="p-3 font-mono text-xs font-semibold text-blue-700">${s.correlativo || ''}</td>
        <td class="p-3 text-slate-600">${s.fecha || ''}</td>
        <td class="p-3 text-slate-700 font-medium">${s.areaNombre || ''}</td>
        <td class="p-3 text-slate-600">${s.responsable || ''}</td>
        <td class="p-3 text-right font-medium text-slate-800">${s.items ? s.items.length : 0}</td>
        <td class="p-3 text-center">
          <div class="flex justify-center gap-2">
            <button type="button" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition" onclick="Salidas.verDetalle(${s.id})">
              Ver
            </button>
            <button type="button" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition" onclick="Salidas.imprimirSalida(${s.id})">
              Imprimir
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function populateDatalists() {
    const areas = App.getData('areas') || [];
    const materials = App.getData('materiales') || [];

    const areaDatalist = document.getElementById('salidas-areas-list');
    if (areaDatalist) {
      areaDatalist.innerHTML = areas
        .filter(a => a.activo !== false)
        .map(a => `<option value="${a.codigo} - ${a.nombre}">`)
        .join('');
    }

    // Global datalist for materials (Código/Iniciales)
    let matDatalist = document.getElementById('materiales-salidas-list');
    if (!matDatalist) {
      matDatalist = document.createElement('datalist');
      matDatalist.id = 'materiales-salidas-list';
      document.body.appendChild(matDatalist);
    }
    matDatalist.innerHTML = materials
      .filter(m => m.activo !== false)
      .map(m => `<option value="${m.codigo} - ${m.nombre}">`)
      .join('');
  }

  function addRow() {
    const tbody = document.getElementById('tbody-items-salida');
    if (!tbody) return;

    rowCount++;
    const tr = document.createElement('tr');
    tr.className = 'item-row';
    tr.innerHTML = `
      <td class="p-3 text-center font-bold text-slate-500 row-number">${tbody.children.length + 1}</td>
      <td class="p-3">
        <input type="text" list="materiales-salidas-list" class="w-full p-2 border-2 border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500 input-item-search" placeholder="Buscar material..." required>
      </td>
      <td class="p-3">
        <input type="text" class="w-full p-2 border-2 border-slate-200 bg-slate-50 rounded-lg text-sm input-item-detalle" readonly placeholder="Autocompletado">
      </td>
      <td class="p-3">
        <input type="text" class="w-full p-2 border-2 border-slate-200 bg-slate-50 rounded-lg text-sm input-item-unidad" readonly placeholder="U. Medida">
      </td>
      <td class="p-3">
        <input type="number" min="1" step="1" class="w-full p-2 border-2 border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500 text-right input-item-cantidad" placeholder="0" required>
      </td>
      <td class="p-3 text-center">
        <button type="button" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition btn-delete-row">
          <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    const role = getRole();
    if (role === 'gerente') {
      tr.querySelectorAll('input, button').forEach(el => el.disabled = true);
    }

    const inputSearch = tr.querySelector('.input-item-search');
    const inputDetalle = tr.querySelector('.input-item-detalle');
    const inputUnidad = tr.querySelector('.input-item-unidad');
    const btnDelete = tr.querySelector('.btn-delete-row');

    inputSearch.addEventListener('input', () => {
      const val = inputSearch.value.trim();
      const materials = App.getData('materiales') || [];
      const mat = materials.find(m => `${m.codigo} - ${m.nombre}` === val || m.nombre === val || m.codigo === val);
      if (mat) {
        inputDetalle.value = mat.nombre;
        inputUnidad.value = mat.unidad;
        inputSearch.dataset.selectedId = mat.id;
      } else {
        inputDetalle.value = '';
        inputUnidad.value = '';
        delete inputSearch.dataset.selectedId;
      }
    });

    btnDelete.addEventListener('click', () => {
      tr.remove();
      recalculateRowNumbers();
    });
  }

  function recalculateRowNumbers() {
    const tbody = document.getElementById('tbody-items-salida');
    if (!tbody) return;
    Array.from(tbody.children).forEach((tr, index) => {
      tr.querySelector('.row-number').textContent = index + 1;
    });
  }

  function setupEvents() {
    const form = document.getElementById('salidas-form');
    if (!form) return;

    const inputArea = document.getElementById('salida-area');
    const inputResp = document.getElementById('salida-responsable');
    const firmaEncargado = document.getElementById('salida-firma-encargado');
    const firmaReceptor = document.getElementById('salida-firma-receptor');

    // Default keeper name
    if (firmaEncargado) {
      firmaEncargado.textContent = getKeeperName();
    }

    // Area selection change
    inputArea?.addEventListener('input', () => {
      const val = inputArea.value.trim();
      const areas = App.getData('areas') || [];
      const area = areas.find(a => `${a.codigo} - ${a.nombre}` === val || a.nombre === val || a.codigo === val);
      if (area) {
        inputArea.dataset.selectedId = area.id;
        inputArea.dataset.selectedNombre = area.nombre;
        
        // Find responsible
        const resps = App.getData('responsables') || [];
        const resp = resps.find(r => r.areaId === area.id && r.activo !== false);
        if (resp) {
          const ap = resp.apellidos && resp.apellidos !== '—' ? ' ' + resp.apellidos : '';
          const name = `${resp.nombres}${ap}`.trim();
          inputResp.value = name;
          if (firmaReceptor) firmaReceptor.textContent = name;
        } else {
          inputResp.value = 'Sin asignar';
          if (firmaReceptor) firmaReceptor.textContent = 'Responsable del Área';
        }
      } else {
        inputResp.value = '';
        if (firmaReceptor) firmaReceptor.textContent = 'Responsable del Área';
        delete inputArea.dataset.selectedId;
        delete inputArea.dataset.selectedNombre;
      }
    });

    // Add row button
    document.getElementById('btn-agregar-item')?.addEventListener('click', addRow);

    // Form submit
    form.onsubmit = (e) => {
      e.preventDefault();

      const role = getRole();
      if (role === 'gerente') {
        alert('El rol Gerente solo tiene permisos de visualización.');
        return;
      }

      const areaId = parseInt(inputArea.dataset.selectedId, 10);
      const areaNombre = inputArea.dataset.selectedNombre;
      const responsable = inputResp.value.trim();
      const fecha = document.getElementById('salida-fecha').value;
      const correlativo = document.getElementById('salida-correlativo').value;

      if (!areaId || !responsable || !fecha || !correlativo) {
        alert('Por favor, complete los datos de cabecera y seleccione un área válida.');
        return;
      }

      // Collect items
      const rows = document.querySelectorAll('.item-row');
      if (rows.length === 0) {
        alert('Debe agregar al menos un ítem a la papeleta.');
        return;
      }

      const items = [];
      let itemsValid = true;

      const materials = App.getData('materiales') || [];

      rows.forEach((tr, index) => {
        const inputSearch = tr.querySelector('.input-item-search');
        const inputCant = tr.querySelector('.input-item-cantidad');
        
        const matId = parseInt(inputSearch.dataset.selectedId, 10);
        const cantidad = parseInt(inputCant.value, 10);

        if (!matId || isNaN(cantidad) || cantidad <= 0) {
          itemsValid = false;
          return;
        }

        const material = materials.find(m => m.id === matId);
        if (!material) {
          itemsValid = false;
          return;
        }

        items.push({
          materialId: material.id,
          materialNombre: material.nombre,
          unidad: material.unidad,
          cantidad: cantidad
        });
      });

      if (!itemsValid) {
        alert('Por favor, verifique que todos los ítems tengan un material válido y una cantidad mayor a cero.');
        return;
      }

      // Deduct stock of materials
      items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        if (material) {
          material.stock = (material.stock || 0) - item.cantidad;
        }
      });

      // Save material updates
      App.setData('materiales', materials);

      // Save exit ticket (salida)
      const salidasList = App.getData('salidas') || [];
      const nuevaSalida = {
        id: nextId(salidasList),
        correlativo,
        fecha,
        areaId,
        areaNombre,
        responsable,
        items,
        guardadoPor: getSession()?.nombre || 'Administrador'
      };

      salidasList.push(nuevaSalida);
      App.setData('salidas', salidasList);

      showToast('Papeleta de salida registrada correctamente.');
      
      // Reset form and UI
      form.reset();
      document.getElementById('tbody-items-salida').innerHTML = '';
      delete inputArea.dataset.selectedId;
      delete inputArea.dataset.selectedNombre;
      
      document.getElementById('salida-correlativo').value = getNextCorrelativo();
      document.getElementById('salida-fecha').value = getTodayString();
      if (firmaReceptor) firmaReceptor.textContent = 'Responsable del Área';
      
      addRow(); // Add one default blank row
      renderTable();
    };

    // Close view modal
    document.getElementById('salida-view-close')?.addEventListener('click', closeModal);
    document.getElementById('btn-cerrar-modal')?.addEventListener('click', closeModal);
  }

  function setupRoleRestrictions() {
    const role = getRole();
    const badgeContainer = document.getElementById('salidas-role-badge');
    const formContainer = document.getElementById('salidas-form-container');
    const inputs = document.querySelectorAll('#salidas-form input, #salidas-form select, #salidas-form button');

    if (badgeContainer) {
      const badgeClass = Auth.getRolBadgeClass(role);
      badgeContainer.innerHTML = `
        <span class="text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}">
          Rol: ${getRoleName()}
        </span>
      `;
    }

    if (role === 'gerente') {
      // Disable all inputs
      inputs.forEach(input => {
        if (input.id !== 'btn-registrar-salida') {
          input.disabled = true;
          if (input.tagName === 'INPUT') {
            input.classList.add('bg-slate-50', 'text-slate-500');
          }
        }
      });
      const submitBtn = document.getElementById('btn-registrar-salida');
      if (submitBtn) submitBtn.style.display = 'none';
      const addRowBtn = document.getElementById('btn-agregar-item');
      if (addRowBtn) addRowBtn.style.display = 'none';

      if (formContainer) {
        const warning = document.createElement('div');
        warning.className = 'alert alert-error mb-4 text-xs font-semibold flex items-center gap-2';
        warning.innerHTML = `
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Modo Lectura (Gerente): No tiene permisos para registrar papeletas de salida.
        `;
        formContainer.insertBefore(warning, formContainer.firstChild);
      }
    }
  }

  function buildHtmlPapeleta(salida, tituloCopia) {
    const itemsHtml = (salida.items || []).map((item, index) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${item.materialNombre}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${item.unidad}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold;">${item.cantidad}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: top;">
              <h1 style="font-size: 14px; font-weight: bold; margin: 0; color: #1e3a8a; text-transform: uppercase;">Municipalidad Municipal</h1>
              <span style="font-size: 11px; color: #64748b; font-weight: bold;">ALMACÉN MUNICIPAL</span>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="display: inline-block; border: 2px solid #1e3a8a; padding: 8px 15px; border-radius: 6px;">
                <span style="display: block; font-size: 12px; font-weight: bold; color: #1e3a8a;">PAPELETA DE SALIDA</span>
                <span style="font-size: 14px; font-weight: bold; font-family: monospace; color: #b91c1c;">${salida.correlativo}</span>
              </div>
              <span style="display: block; font-size: 10px; color: #64748b; margin-top: 4px; font-weight: bold;">${tituloCopia}</span>
            </td>
          </tr>
        </table>

        <!-- Datos Generales -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <tr>
            <td style="padding: 8px 12px; width: 50%;"><strong>Área Usuaria:</strong> ${salida.areaNombre}</td>
            <td style="padding: 8px 12px; width: 50%;"><strong>Fecha:</strong> ${salida.fecha}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; width: 50%;"><strong>Responsable:</strong> ${salida.responsable}</td>
            <td style="padding: 8px 12px; width: 50%;"><strong>Entregado Por:</strong> ${salida.guardadoPor || 'Encargado'}</td>
          </tr>
        </table>

        <!-- Tabla items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 40px;">N°</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Descripción del Material</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 100px;">U. Medida</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 80px; text-align: right;">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Firmas -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 30px;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 10px;">
              <div style="width: 180px; border-bottom: 1.5px dashed #64748b; margin: 0 auto 5px auto;"></div>
              <strong>Entregado Por (Almacén)</strong><br>
              <span style="font-size: 10px; color: #64748b;">Firma y Sello</span>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 10px;">
              <div style="width: 180px; border-bottom: 1.5px dashed #64748b; margin: 0 auto 5px auto;"></div>
              <strong>Recibí Conforme (Receptor)</strong><br>
              <span style="font-size: 10px; color: #64748b;">${salida.responsable}</span>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  function closeModal() {
    document.getElementById('salidas-view-modal').classList.add('hidden');
    document.getElementById('salida-view-detail').innerHTML = '';
  }

  function verDetalle(id) {
    const list = App.getData('salidas') || [];
    const s = list.find(x => x.id === id);
    if (!s) return;

    document.getElementById('salida-view-title').textContent = `Detalle de Salida: ${s.correlativo}`;
    
    const itemsHtml = (s.items || []).map((item, index) => `
      <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
        <td class="p-2 text-center text-slate-500 font-semibold">${index + 1}</td>
        <td class="p-2 text-slate-700 font-medium">${item.materialNombre}</td>
        <td class="p-2 text-slate-500">${item.unidad}</td>
        <td class="p-2 text-right font-bold text-slate-800">${item.cantidad}</td>
      </tr>
    `).join('');

    document.getElementById('salida-view-detail').innerHTML = `
      <div class="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Área Destino</p>
          <p class="text-sm font-bold text-slate-700 mt-0.5">${s.areaNombre}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fecha</p>
          <p class="text-sm font-bold text-slate-700 mt-0.5">${s.fecha}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Responsable Receptor</p>
          <p class="text-sm font-bold text-slate-700 mt-0.5">${s.responsable}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registrado Por</p>
          <p class="text-sm font-bold text-slate-700 mt-0.5">${s.guardadoPor || 'Encargado'}</p>
        </div>
      </div>
      <div class="mt-4">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materiales Entregados</h4>
        <div class="overflow-hidden rounded-lg border border-slate-100">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs text-left">
                <th class="p-2 text-center w-12">N°</th>
                <th class="p-2">Material</th>
                <th class="p-2 w-28">U. Medida</th>
                <th class="p-2 text-right w-24">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const printBtn = document.getElementById('btn-imprimir-modal');
    if (printBtn) {
      printBtn.onclick = () => {
        imprimirSalida(s.id);
        closeModal();
      };
    }

    document.getElementById('salidas-view-modal').classList.remove('hidden');
  }

  function imprimirSalida(id) {
    const list = App.getData('salidas') || [];
    const s = list.find(x => x.id === id);
    if (!s) return;

    const originalHtml = buildHtmlPapeleta(s, 'ORIGINAL (PARA ALMACÉN)');
    const copiaHtml = buildHtmlPapeleta(s, 'COPIA (PARA EL ÁREA USUARIA)');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita las ventanas emergentes (popups) para poder imprimir la papeleta.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Papeleta de Salida - ${s.correlativo}</title>
        <style>
          body { margin: 0; background: #ffffff; padding: 10px; }
          .page { page-break-after: always; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${originalHtml}
          
          <div style="margin: 40px 0; border-top: 2px dashed #94a3b8; position: relative; text-align: center;">
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #ffffff; padding: 0 15px; font-size: 11px; font-family: Arial, sans-serif; font-weight: bold; color: #64748b; text-transform: uppercase;">
              ✂️ CORTAR AQUÍ
            </span>
          </div>

          ${copiaHtml}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  function init() {
    console.log("Salidas.init() called!");
    const module = document.getElementById('salidas-module');
    if (!module) return;

    const correlInput = document.getElementById('salida-correlativo');
    if (correlInput) {
      correlInput.value = getNextCorrelativo();
    }

    const dateInput = document.getElementById('salida-fecha');
    if (dateInput) {
      dateInput.value = getTodayString();
    }

    populateDatalists();
    document.getElementById('tbody-items-salida').innerHTML = '';
    addRow(); // Initial row
    setupEvents();
    setupRoleRestrictions();
    renderTable();
  }

  function hookRouter() {
    if (!window.App || App.navigate._salidasHooked) return;

    const originalNavigate = App.navigate;
    App.navigate = function (route) {
      originalNavigate.call(App, route);
      if (route === 'salidas') {
        const observer = new MutationObserver((mutations, obs) => {
          if (document.getElementById('salidas-module')) {
            obs.disconnect();
            init();
          }
        });
        observer.observe(document.getElementById('main-content'), { childList: true, subtree: true });
        
        setTimeout(() => {
          if (document.getElementById('salidas-module')) {
            observer.disconnect();
            init();
          }
        }, 500);
      }
    };
    App.navigate._salidasHooked = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookRouter);
  } else {
    hookRouter();
  }

  return { 
    init,
    verDetalle,
    imprimirSalida
  };
})();

window.Salidas = Salidas;
