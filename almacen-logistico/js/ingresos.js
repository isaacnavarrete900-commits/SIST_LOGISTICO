/**
 * ingresos.js — Módulo de Ingresos de Stock
 * Sistema Logístico de Almacén Municipal
 */

const Ingresos = (() => {
  let initialized = false;

  function getSession() {
    return Auth.getSession();
  }

  function getRole() {
    const session = getSession();
    return session?.rolKey || 'asistente';
  }

  function getRoleName() {
    const session = getSession();
    return session?.rol || 'Asistente';
  }

  function showToast(message) {
    const toast = document.getElementById('ingresos-toast');
    const msg = document.getElementById('ingresos-toast-msg');
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

  function renderTable() {
    const list = App.getData('ingresos') || [];
    const tbody = document.getElementById('tbody-ingresos');
    const empty = document.getElementById('empty-ingresos');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    // Most recent first
    const sorted = [...list].reverse();

    tbody.innerHTML = sorted.map((item) => `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="p-3 text-slate-700">${item.fecha || ''}</td>
        <td class="p-3 font-mono text-xs text-blue-700">${item.ordenCompra || ''}</td>
        <td class="p-3 text-slate-700 font-medium">${item.materialNombre || ''}</td>
        <td class="p-3 text-slate-600">${item.areaNombre || ''}</td>
        <td class="p-3 text-right font-medium text-slate-800">${item.cantidad || 0}</td>
        <td class="p-3 text-right text-slate-600">${Number(item.precio || 0).toFixed(2)}</td>
        <td class="p-3 text-right font-bold text-slate-800">${Number(item.total || 0).toFixed(2)}</td>
        <td class="p-3 text-slate-700 font-mono text-xs">${item.nea || ''}</td>
        <td class="p-3 text-slate-700 font-mono text-xs">${item.pecosa || ''}</td>
      </tr>
    `).join('');
  }

  function setupAutocomplete() {
    const materials = App.getData('materiales') || [];
    const areas = App.getData('areas') || [];
    const clasificadores = App.getData('clasificadores') || [];

    // Populate materials list
    const matDatalist = document.getElementById('materiales-list');
    if (matDatalist) {
      matDatalist.innerHTML = materials
        .filter(m => m.activo !== false)
        .map(m => `<option value="${m.codigo} - ${m.nombre}">`)
        .join('');
    }

    // Populate areas list
    const areaDatalist = document.getElementById('areas-list');
    if (areaDatalist) {
      areaDatalist.innerHTML = areas
        .filter(a => a.activo !== false)
        .map(a => `<option value="${a.codigo} - ${a.nombre}">`)
        .join('');
    }

    // Populate clasificadores dropdown
    const clasifSelect = document.getElementById('ingreso-clasificador');
    if (clasifSelect) {
      // Clear previous options except placeholder
      clasifSelect.innerHTML = '<option value="">Seleccione clasificador</option>' + 
        clasificadores.map(c => {
          const detail = c.detalle || c.nombre || c.descripcion || '';
          return `<option value="${c.codigo}">${c.codigo} - ${detail}</option>`;
        }).join('');
    }
  }

  function setupEvents() {
    const form = document.getElementById('ingresos-form');
    if (!form) return;

    const inputMat = document.getElementById('ingreso-material');
    const inputUnidad = document.getElementById('ingreso-unidad');
    const inputArea = document.getElementById('ingreso-area');
    const inputCant = document.getElementById('ingreso-cantidad');
    const inputPrecio = document.getElementById('ingreso-precio');
    const inputTotal = document.getElementById('ingreso-total');

    // Material autocomplete select logic
    inputMat?.addEventListener('input', () => {
      const val = inputMat.value.trim();
      const materials = App.getData('materiales') || [];
      const mat = materials.find(m => `${m.codigo} - ${m.nombre}` === val || m.nombre === val || m.codigo === val);
      if (mat) {
        inputUnidad.value = mat.unidad;
        inputMat.dataset.selectedId = mat.id;
      } else {
        inputUnidad.value = '';
        delete inputMat.dataset.selectedId;
      }
    });

    // Area selection logic
    inputArea?.addEventListener('input', () => {
      const val = inputArea.value.trim();
      const areas = App.getData('areas') || [];
      const area = areas.find(a => `${a.codigo} - ${a.nombre}` === val || a.nombre === val || a.codigo === val);
      if (area) {
        inputArea.dataset.selectedId = area.id;
      } else {
        delete inputArea.dataset.selectedId;
      }
    });

    // Total auto-calculation
    const calcTotal = () => {
      const qty = parseFloat(inputCant.value) || 0;
      const price = parseFloat(inputPrecio.value) || 0;
      inputTotal.value = (qty * price).toFixed(2);
    };

    inputCant?.addEventListener('input', calcTotal);
    inputPrecio?.addEventListener('input', calcTotal);

    // Form submit
    form.onsubmit = (e) => {
      e.preventDefault();

      const role = getRole();
      if (role === 'gerente') {
        alert('El rol Gerente solo tiene permisos de visualización.');
        return;
      }

      const oc = document.getElementById('ingreso-oc').value.trim();
      const matVal = inputMat.value.trim();
      const areaVal = inputArea.value.trim();
      const clasificador = document.getElementById('ingreso-clasificador').value;
      const cantidad = parseInt(inputCant.value, 10);
      const precio = parseFloat(inputPrecio.value);
      const fecha = document.getElementById('ingreso-fecha').value;
      const nea = document.getElementById('ingreso-nea').value.trim();
      const pecosa = document.getElementById('ingreso-pecosa').value.trim();

      if (!oc || !matVal || !areaVal || !clasificador || isNaN(cantidad) || isNaN(precio) || !fecha || !nea || !pecosa) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
      }

      // Verify material selection
      const materials = App.getData('materiales') || [];
      const matId = parseInt(inputMat.dataset.selectedId, 10);
      const material = materials.find(m => m.id === matId || `${m.codigo} - ${m.nombre}` === matVal);
      if (!material) {
        alert('Por favor, seleccione un material válido de la lista de autocompletado.');
        return;
      }

      // Verify area selection
      const areas = App.getData('areas') || [];
      const aId = parseInt(inputArea.dataset.selectedId, 10);
      const area = areas.find(a => a.id === aId || `${a.codigo} - ${a.nombre}` === areaVal);
      if (!area) {
        alert('Por favor, seleccione un área válida de la lista de autocompletado.');
        return;
      }

      // Update material stock
      material.stock = (material.stock || 0) + cantidad;
      App.setData('materiales', materials);

      // Save movement
      const total = cantidad * precio;
      const list = App.getData('ingresos') || [];
      const nuevoIngreso = {
        id: nextId(list),
        fecha,
        ordenCompra: oc,
        materialId: material.id,
        materialNombre: material.nombre,
        unidad: material.unidad,
        areaId: area.id,
        areaNombre: area.nombre,
        cantidad,
        precio,
        total,
        nea,
        pecosa,
        clasificador
      };

      list.push(nuevoIngreso);
      App.setData('ingresos', list);

      showToast('Ingreso de stock registrado correctamente.');
      
      // Clear form and reset defaults
      form.reset();
      document.getElementById('ingreso-fecha').value = getTodayString();
      delete inputMat.dataset.selectedId;
      delete inputArea.dataset.selectedId;

      renderTable();
    };
  }

  function setupRoleRestrictions() {
    const role = getRole();
    const badgeContainer = document.getElementById('ingresos-role-badge');
    const formContainer = document.getElementById('ingresos-form-container');
    const inputs = document.querySelectorAll('#ingresos-form input, #ingresos-form select, #ingresos-form button');

    if (badgeContainer) {
      const badgeClass = Auth.getRolBadgeClass(role);
      badgeContainer.innerHTML = `
        <span class="text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}">
          Rol: ${getRoleName()}
        </span>
      `;
    }

    if (role === 'gerente') {
      // Gerente only visualizes: disable all inputs and hide submit button
      inputs.forEach(input => {
        if (input.id !== 'btn-registrar-ingreso') {
          input.disabled = true;
          if (input.tagName === 'INPUT') {
            input.classList.add('bg-slate-50', 'text-slate-500');
          }
        }
      });
      const submitBtn = document.getElementById('btn-registrar-ingreso');
      if (submitBtn) submitBtn.style.display = 'none';

      if (formContainer) {
        // Add a warning header to form container
        const warning = document.createElement('div');
        warning.className = 'alert alert-error mb-4 text-xs font-semibold flex items-center gap-2';
        warning.innerHTML = `
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Modo Lectura (Gerente): No tiene permisos para registrar nuevos ingresos.
        `;
        formContainer.insertBefore(warning, formContainer.firstChild);
      }
    }
  }

  function init() {
    console.log("Ingresos.init() called!");
    const module = document.getElementById('ingresos-module');
    if (!module) return;

    // Set today's date by default
    const dateInput = document.getElementById('ingreso-fecha');
    if (dateInput) {
      dateInput.value = getTodayString();
    }

    setupAutocomplete();
    setupEvents();
    setupRoleRestrictions();
    renderTable();
    initialized = true;
  }

  // Hook router to automatically initialize when route is 'ingresos'
  function hookRouter() {
    if (!window.App || App.navigate._ingresosHooked) return;

    const originalNavigate = App.navigate;
    App.navigate = function (route) {
      originalNavigate.call(App, route);
      if (route === 'ingresos') {
        const observer = new MutationObserver((mutations, obs) => {
          if (document.getElementById('ingresos-module')) {
            obs.disconnect();
            init();
          }
        });
        observer.observe(document.getElementById('main-content'), { childList: true, subtree: true });
        
        setTimeout(() => {
          if (document.getElementById('ingresos-module')) {
            observer.disconnect();
            init();
          }
        }, 500);
      }
    };
    App.navigate._ingresosHooked = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookRouter);
  } else {
    hookRouter();
  }

  return { init };
})();

window.Ingresos = Ingresos;
