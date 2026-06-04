/**
 * reportes.js — Dashboard analítico y generación de reportes
 * Sistema Logístico de Almacén Municipal
 */

const Reportes = (() => {
  let activeTab = 'dashboard';

  // Instancias de gráficos para destruirlos al recargar
  let chartTopStock = null;
  let chartSalidasArea = null;
  let chartIngresosSalidas = null;

  function getSession() {
    return Auth.getSession();
  }

  function getRole() {
    return getSession()?.rolKey || 'asistente';
  }

  function getRoleName() {
    return getSession()?.rol || 'Asistente';
  }

  function canExport() {
    const role = getRole();
    return role === 'admin' || role === 'gerente';
  }

  function showToast(message, isSuccess = true) {
    const toast = document.getElementById('reportes-toast');
    const msg = document.getElementById('reportes-toast-msg');
    if (!toast || !msg) return;

    msg.textContent = message;
    if (isSuccess) {
      toast.firstElementChild.className = "flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium";
    } else {
      toast.firstElementChild.className = "flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium";
    }

    toast.classList.remove('hidden');
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  /* =========================================================================
     TAB MANAGEMENT
     ========================================================================= */
  function setupTabNavigation() {
    const tabs = document.querySelectorAll('.reportes-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        if (!targetTab) return;

        // Cambiar pestaña activa
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Ocultar todos los paneles
        document.querySelectorAll('.reportes-panel').forEach(p => p.classList.add('hidden'));

        // Mostrar panel destino
        const panel = document.getElementById(`panel-${targetTab}`);
        if (panel) {
          panel.classList.remove('hidden');
        }

        activeTab = targetTab;
        onTabActivated(targetTab);
      });
    });
  }

  function onTabActivated(tabName) {
    if (tabName === 'dashboard') {
      initDashboard();
    } else if (tabName === 'stock') {
      initStockTab();
    } else if (tabName === 'kardex') {
      initKardexTab();
    } else if (tabName === 'movimientos') {
      initMovimientosTab();
    }
  }

  /* =========================================================================
     TAB 1: DASHBOARD
     ========================================================================= */
  function initDashboard() {
    const materiales = App.getData('materiales') || [];
    const areas = App.getData('areas') || [];
    const ingresos = App.getData('ingresos') || [];
    const salidas = App.getData('salidas') || [];

    // 1. Tarjetas resumen
    const activeMaterialsCount = materiales.filter(m => m.activo !== false).length;
    const activeAreasCount = areas.filter(a => a.activo !== false).length;
    const totalStock = materiales.filter(m => m.activo !== false).reduce((sum, m) => sum + (m.stock || 0), 0);

    // Calcular movimientos del mes actual
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const ingresosMes = ingresos.filter(i => (i.fecha || '').startsWith(currentYearMonth)).length;
    const salidasMes = salidas.filter(s => (s.fecha || '').startsWith(currentYearMonth)).length;
    const movimientosMes = ingresosMes + salidasMes;

    // Actualizar HTML de tarjetas
    document.getElementById('dash-total-materiales').textContent = activeMaterialsCount;
    document.getElementById('dash-total-areas').textContent = activeAreasCount;
    document.getElementById('dash-unidades-stock').textContent = totalStock.toLocaleString('es-PE');
    document.getElementById('dash-movimientos-mes').textContent = movimientosMes;

    // 2. Gráfico 1: Top 10 materiales con más stock
    renderTopStockChart(materiales);

    // 3. Gráfico 2: Distribución de salidas por área
    renderSalidasAreaChart(salidas, areas);

    // 4. Gráfico 3: Ingresos vs Salidas por mes (últimos 6 meses)
    renderIngresosSalidasChart(ingresos, salidas);
  }

  function renderTopStockChart(materiales) {
    const canvas = document.getElementById('chart-top-stock');
    if (!canvas) return;

    // Filtrar activos, ordenar de mayor a menor y tomar top 10
    const topMaterials = [...materiales]
      .filter(m => m.activo !== false)
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 10);

    const labels = topMaterials.map(m => {
      const label = m.nombre || '';
      return label.length > 18 ? label.substring(0, 15) + '...' : label;
    });
    const data = topMaterials.map(m => m.stock || 0);

    if (chartTopStock) {
      chartTopStock.destroy();
    }

    chartTopStock = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Unidades en Stock',
          data: data,
          backgroundColor: 'rgba(30, 58, 138, 0.85)', // Corporate Blue
          borderColor: 'rgb(30, 58, 138)',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  }

  function renderSalidasAreaChart(salidas, areas) {
    const canvas = document.getElementById('chart-salidas-area');
    if (!canvas) return;

    // Agrupar cantidad de materiales entregados por área
    const areaQuantities = {};
    salidas.forEach(s => {
      const areaName = s.areaNombre || 'Desconocido';
      let totalCant = 0;
      if (s.items && Array.isArray(s.items)) {
        totalCant = s.items.reduce((sum, item) => sum + (item.cantidad || 0), 0);
      }
      areaQuantities[areaName] = (areaQuantities[areaName] || 0) + totalCant;
    });

    const entries = Object.entries(areaQuantities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7); // Mostrar máximo las top 7 áreas y agrupar el resto en "Otros"

    let labels = entries.map(e => e[0]);
    let data = entries.map(e => e[1]);

    const totalEgress = Object.values(areaQuantities).reduce((sum, val) => sum + val, 0);
    const top7Sum = data.reduce((sum, val) => sum + val, 0);
    const otrosSum = totalEgress - top7Sum;

    if (otrosSum > 0) {
      labels.push('Otras Áreas');
      data.push(otrosSum);
    }

    if (chartSalidasArea) {
      chartSalidasArea.destroy();
    }

    if (labels.length === 0) {
      // Dibujar gráfico vacío o con datos de ejemplo
      labels = ['Sin salidas registradas'];
      data = [1];
    }

    const colors = [
      '#1e3a8a', // Blue 900
      '#3b82f6', // Blue 500
      '#10b981', // Emerald 500
      '#f59e0b', // Amber 500
      '#8b5cf6', // Violet 500
      '#ec4899', // Pink 500
      '#06b6d4', // Cyan 500
      '#94a3b8'  // Slate 400 (para otros)
    ];

    chartSalidasArea = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1.5,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { size: 10 } }
          }
        },
        cutout: '60%'
      }
    });
  }

  function renderIngresosSalidasChart(ingresos, salidas) {
    const canvas = document.getElementById('chart-ingresos-salidas');
    if (!canvas) return;

    // Calcular los últimos 6 meses cronológicamente
    const labels = [];
    const monthKeys = []; // YYYY-MM
    const today = new Date();
    const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      monthKeys.push(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      labels.push(`${monthNamesEs[monthIndex]} ${year}`);
    }

    const dataIngresos = monthKeys.map(key => {
      // Sumar cantidad de todos los ingresos de ese mes
      return ingresos
        .filter(i => (i.fecha || '').startsWith(key))
        .reduce((sum, item) => sum + (item.cantidad || 0), 0);
    });

    const dataSalidas = monthKeys.map(key => {
      // Sumar cantidad de ítems de todas las salidas de ese mes
      return salidas
        .filter(s => (s.fecha || '').startsWith(key))
        .reduce((sum, s) => {
          const sCant = s.items ? s.items.reduce((sumIt, item) => sumIt + (item.cantidad || 0), 0) : 0;
          return sum + sCant;
        }, 0);
    });

    if (chartIngresosSalidas) {
      chartIngresosSalidas.destroy();
    }

    chartIngresosSalidas = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cantidad Ingresada',
            data: dataIngresos,
            borderColor: '#10b981', // Emerald 500
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Cantidad Saliente',
            data: dataSalidas,
            borderColor: '#3b82f6', // Blue 500
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 15, font: { size: 10 } } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  /* =========================================================================
     TAB 2: CONTROL DE STOCK
     ========================================================================= */
  function initStockTab() {
    renderStockTable();
    
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
      searchInput.oninput = () => {
        renderStockTable(searchInput.value.trim());
      };
    }

    const btnExport = document.getElementById('btn-exportar-stock');
    if (btnExport) {
      btnExport.disabled = !canExport();
      btnExport.onclick = exportStockToExcel;
    }
  }

  function getFilteredStock(query = '') {
    const materiales = App.getData('materiales') || [];
    const queryLower = query.toLowerCase();
    
    return materiales.filter(m => {
      if (m.activo === false) return false;
      if (!query) return true;
      return (m.codigo || '').toLowerCase().includes(queryLower) ||
             (m.nombre || '').toLowerCase().includes(queryLower);
    });
  }

  function renderStockTable(query = '') {
    const filtered = getFilteredStock(query);
    const tbody = document.getElementById('tbody-stock');
    const empty = document.getElementById('empty-stock');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = filtered.map(m => {
      const isLow = (m.stock || 0) < 10;
      const badgeClass = isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
      const badgeText = isLow ? 'Bajo Stock' : 'Suficiente';
      
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="p-3 font-mono text-xs font-semibold text-blue-700">${m.codigo || ''}</td>
          <td class="p-3 text-slate-700 font-medium">${m.nombre || ''}</td>
          <td class="p-3 text-slate-500">${m.unidad || ''}</td>
          <td class="p-3 text-right font-bold text-slate-800">${m.stock || 0}</td>
          <td class="p-3 text-center">
            <span class="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}">
              ${badgeText}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  function exportStockToExcel() {
    if (!canExport()) {
      showToast('No tiene permisos para exportar reportes.', false);
      return;
    }

    const searchInput = document.getElementById('stock-search');
    const query = searchInput ? searchInput.value.trim() : '';
    const data = getFilteredStock(query);

    if (data.length === 0) {
      showToast('No hay datos para exportar.', false);
      return;
    }

    const rows = data.map(m => ({
      'Código': m.codigo || '',
      'Material': m.nombre || '',
      'Unidad de Medida': m.unidad || '',
      'Stock Actual': m.stock || 0,
      'Estado': (m.stock || 0) < 10 ? 'Bajo Stock' : 'Suficiente'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    
    // Auto ajustar columnas
    const max_widths = Object.keys(rows[0]).map(key => {
      return Math.max(key.length, ...rows.map(row => String(row[key] || '').length)) + 2;
    });
    ws['!cols'] = max_widths.map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, "Control Stock");
    XLSX.writeFile(wb, `Reporte_Stock_Almacen_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Reporte de stock exportado correctamente.');
  }

  /* =========================================================================
     TAB 3: KARDEX POR MATERIAL
     ========================================================================= */
  function initKardexTab() {
    populateKardexMaterialSelect();

    const select = document.getElementById('kardex-material-select');
    if (select) {
      select.onchange = () => {
        renderKardexTable(parseInt(select.value, 10));
      };
    }

    const btnExport = document.getElementById('btn-exportar-kardex');
    if (btnExport) {
      btnExport.disabled = !canExport();
      btnExport.onclick = exportKardexToExcel;
    }
  }

  function populateKardexMaterialSelect() {
    const select = document.getElementById('kardex-material-select');
    if (!select) return;

    const materials = App.getData('materiales') || [];
    const active = materials.filter(m => m.activo !== false);

    // Guardar valor anterior para intentar restaurarlo
    const prevVal = select.value;

    select.innerHTML = '<option value="">Seleccione un material...</option>' + 
      active.map(m => `<option value="${m.id}">${m.codigo} - ${m.nombre}</option>`).join('');

    if (prevVal && active.find(m => String(m.id) === prevVal)) {
      select.value = prevVal;
    }
  }

  function getKardexData(materialId) {
    if (!materialId || isNaN(materialId)) return null;

    const materiales = App.getData('materiales') || [];
    const material = materiales.find(m => m.id === materialId);
    if (!material) return null;

    const ingresos = App.getData('ingresos') || [];
    const salidas = App.getData('salidas') || [];

    const movements = [];

    // 1. Recopilar Ingresos para este material
    ingresos.forEach(i => {
      if (i.materialId === materialId) {
        movements.push({
          id: `ing-${i.id}`,
          fecha: i.fecha,
          tipo: 'INGRESO',
          documento: i.ordenCompra ? `OC: ${i.ordenCompra}` : 'S/D',
          area: i.areaNombre || 'Almacén',
          cantidad: i.cantidad || 0
        });
      }
    });

    // 2. Recopilar Salidas para este material
    salidas.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          if (item.materialId === materialId) {
            movements.push({
              id: `sal-${s.id}`,
              fecha: s.fecha,
              tipo: 'SALIDA',
              documento: s.correlativo || 'S/D',
              area: s.areaNombre || 'Usuario',
              cantidad: item.cantidad || 0
            });
          }
        });
      }
    });

    // 3. Ordenar cronológicamente (Fecha ascendente)
    movements.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // 4. Recalcular el stock resultante paso a paso
    // Suma total ingresada - Suma total retirada = Stock inicial antes de movimientos.
    // Stock actual = Stock inicial + Suma Ingresos - Suma Salidas.
    const sumIngresos = movements.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.cantidad, 0);
    const sumSalidas = movements.filter(m => m.tipo === 'SALIDA').reduce((sum, m) => sum + m.cantidad, 0);
    
    let runningStock = (material.stock || 0) - sumIngresos + sumSalidas;
    const initialStock = runningStock;

    const kardexRows = movements.map(m => {
      if (m.tipo === 'INGRESO') {
        runningStock += m.cantidad;
      } else {
        runningStock -= m.cantidad;
      }
      return {
        ...m,
        stockResultante: runningStock
      };
    });

    return {
      material,
      initialStock,
      kardexRows
    };
  }

  function renderKardexTable(materialId) {
    const tbody = document.getElementById('tbody-kardex');
    const empty = document.getElementById('empty-kardex');
    if (!tbody) return;

    if (!materialId || isNaN(materialId)) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Seleccione un material para ver su Kardex de movimientos.</td></tr>`;
      empty?.classList.add('hidden');
      return;
    }

    const data = getKardexData(materialId);
    if (!data || data.kardexRows.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    // Mostramos cronología inversa en la tabla (lo más reciente arriba)
    const reversedRows = [...data.kardexRows].reverse();

    tbody.innerHTML = reversedRows.map(k => {
      const typeBadgeClass = k.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
      const cantSign = k.tipo === 'INGRESO' ? `+${k.cantidad}` : `-${k.cantidad}`;
      const cantClass = k.tipo === 'INGRESO' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="p-3 text-slate-600">${k.fecha}</td>
          <td class="p-3 text-center">
            <span class="inline-block text-xs font-bold px-2 py-0.5 rounded ${typeBadgeClass}">
              ${k.tipo}
            </span>
          </td>
          <td class="p-3 font-mono text-xs font-semibold text-slate-700">${k.documento}</td>
          <td class="p-3 text-slate-700 font-medium">${k.area}</td>
          <td class="p-3 text-right ${cantClass}">${cantSign}</td>
          <td class="p-3 text-right font-bold text-slate-800 bg-slate-50/50">${k.stockResultante}</td>
        </tr>
      `;
    }).join('');
  }

  function exportKardexToExcel() {
    if (!canExport()) {
      showToast('No tiene permisos para exportar reportes.', false);
      return;
    }

    const select = document.getElementById('kardex-material-select');
    const materialId = select ? parseInt(select.value, 10) : null;

    if (!materialId || isNaN(materialId)) {
      showToast('Por favor, seleccione un material para exportar su Kardex.', false);
      return;
    }

    const data = getKardexData(materialId);
    if (!data || data.kardexRows.length === 0) {
      showToast('No se registran movimientos para exportar.', false);
      return;
    }

    const rows = data.kardexRows.map(k => ({
      'Fecha': k.fecha,
      'Tipo de Movimiento': k.tipo,
      'Documento de Referencia': k.documento,
      'Área Destino / Procedencia': k.area,
      'Cantidad': k.tipo === 'INGRESO' ? k.cantidad : -k.cantidad,
      'Stock Resultante': k.stockResultante
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    // Auto ajustar columnas
    const max_widths = Object.keys(rows[0]).map(key => {
      return Math.max(key.length, ...rows.map(row => String(row[key] || '').length)) + 2;
    });
    ws['!cols'] = max_widths.map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, "Kardex Histórico");
    XLSX.writeFile(wb, `Kardex_Material_${data.material.codigo || 'MAT'}_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Kardex de movimientos exportado correctamente.');
  }

  /* =========================================================================
     TAB 4: HISTORIAL DE MOVIMIENTOS
     ========================================================================= */
  function initMovimientosTab() {
    populateMovimientosFiltros();
    renderMovimientosTable();

    // Eventos de cambios en filtros
    const filters = [
      'filtro-area', 'filtro-tipo', 'filtro-fecha-desde', 'filtro-fecha-hasta',
      'filtro-oc', 'filtro-nea', 'filtro-pecosa', 'filtro-clasificador'
    ];

    filters.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.oninput = el.onchange = renderMovimientosTable;
      }
    });

    const btnClear = document.getElementById('btn-limpiar-filtros');
    if (btnClear) {
      btnClear.onclick = () => {
        filters.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        renderMovimientosTable();
      };
    }

    const btnExport = document.getElementById('btn-exportar-movimientos');
    if (btnExport) {
      btnExport.disabled = !canExport();
      btnExport.onclick = exportMovimientosToExcel;
    }
  }

  function populateMovimientosFiltros() {
    const areas = App.getData('areas') || [];
    const clasificadores = App.getData('clasificadores') || [];

    const selectArea = document.getElementById('filtro-area');
    if (selectArea) {
      const activeAreas = areas.filter(a => a.activo !== false);
      selectArea.innerHTML = '<option value="">Todas las áreas</option>' +
        activeAreas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
    }

    const selectClasif = document.getElementById('filtro-clasificador');
    if (selectClasif) {
      selectClasif.innerHTML = '<option value="">Todos los clasificadores</option>' +
        clasificadores.map(c => `<option value="${c.codigo}">${c.codigo} - ${c.nombre || c.detalle}</option>`).join('');
    }
  }

  function getFilteredMovimientos() {
    const ingresos = App.getData('ingresos') || [];
    const salidas = App.getData('salidas') || [];
    const materiales = App.getData('materiales') || [];

    const list = [];

    // Aplanar Ingresos
    ingresos.forEach(i => {
      list.push({
        id: `ing-${i.id}`,
        fecha: i.fecha || '',
        tipo: 'INGRESO',
        materialNombre: i.materialNombre || 'Material Desconocido',
        areaNombre: i.areaNombre || 'Almacén Central',
        cantidad: i.cantidad || 0,
        documento: i.ordenCompra ? `OC: ${i.ordenCompra}` : 'S/D',
        docRef: i.ordenCompra || '',
        nea: i.nea || '',
        pecosa: i.pecosa || '',
        clasificador: i.clasificador || ''
      });
    });

    // Aplanar Salidas
    salidas.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item, index) => {
          // Obtener el clasificador del material asociado
          const mat = materiales.find(m => m.id === item.materialId);
          const clasif = mat ? mat.clasificador || '' : '';

          list.push({
            id: `sal-${s.id}-${index}`,
            fecha: s.fecha || '',
            tipo: 'SALIDA',
            materialNombre: item.materialNombre || 'Material Desconocido',
            areaNombre: s.areaNombre || 'Usuario Receptor',
            cantidad: item.cantidad || 0,
            documento: s.correlativo || 'S/D',
            docRef: s.correlativo || '',
            nea: '—',
            pecosa: '—',
            clasificador: clasif
          });
        });
      }
    });

    // Ordenar de más reciente a más antiguo por defecto
    list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Aplicar Filtros Combinables
    const filtroArea = document.getElementById('filtro-area')?.value;
    const filtroTipo = document.getElementById('filtro-tipo')?.value;
    const filtroFechaDesde = document.getElementById('filtro-fecha-desde')?.value;
    const filtroFechaHasta = document.getElementById('filtro-fecha-hasta')?.value;
    const filtroOc = document.getElementById('filtro-oc')?.value.trim().toLowerCase();
    const filtroNea = document.getElementById('filtro-nea')?.value.trim().toLowerCase();
    const filtroPecosa = document.getElementById('filtro-pecosa')?.value.trim().toLowerCase();
    const filtroClasif = document.getElementById('filtro-clasificador')?.value;

    return list.filter(m => {
      // Filtrar Área
      if (filtroArea && m.areaNombre !== filtroArea) return false;

      // Filtrar Tipo
      if (filtroTipo && m.tipo !== filtroTipo) return false;

      // Filtrar Fechas
      if (filtroFechaDesde && m.fecha < filtroFechaDesde) return false;
      if (filtroFechaHasta && m.fecha > filtroFechaHasta) return false;

      // Filtrar OC / Referencia
      if (filtroOc) {
        if (m.tipo === 'INGRESO' && !m.docRef.toLowerCase().includes(filtroOc)) return false;
        if (m.tipo === 'SALIDA' && !m.docRef.toLowerCase().includes(filtroOc)) return false;
      }

      // Filtrar NEA
      if (filtroNea && (m.nea === '—' || !m.nea.toLowerCase().includes(filtroNea))) return false;

      // Filtrar PECOSA
      if (filtroPecosa && (m.pecosa === '—' || !m.pecosa.toLowerCase().includes(filtroPecosa))) return false;

      // Filtrar Clasificador
      if (filtroClasif && m.clasificador !== filtroClasif) return false;

      return true;
    });
  }

  function renderMovimientosTable() {
    const filtered = getFilteredMovimientos();
    const tbody = document.getElementById('tbody-movimientos');
    const empty = document.getElementById('empty-movimientos');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = filtered.map(m => {
      const typeBadgeClass = m.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
      const cantSign = m.tipo === 'INGRESO' ? `+${m.cantidad}` : `-${m.cantidad}`;
      const cantClass = m.tipo === 'INGRESO' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';

      // Detallar documentos extras en ingresos
      let docRefLabel = m.documento;
      if (m.tipo === 'INGRESO' && (m.nea || m.pecosa)) {
        docRefLabel += ` <div class="text-[10px] text-slate-400 mt-0.5">NEA: ${m.nea} | PEC: ${m.pecosa}</div>`;
      }

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="p-3 text-slate-600">${m.fecha}</td>
          <td class="p-3 text-center">
            <span class="inline-block text-xs font-bold px-2 py-0.5 rounded ${typeBadgeClass}">
              ${m.tipo}
            </span>
          </td>
          <td class="p-3 text-slate-700 font-medium">${m.materialNombre}</td>
          <td class="p-3 text-slate-600">${m.areaNombre}</td>
          <td class="p-3 text-right ${cantClass}">${cantSign}</td>
          <td class="p-3 font-mono text-xs font-semibold text-slate-700">${docRefLabel}</td>
          <td class="p-3 text-slate-500 font-mono text-xs">${m.clasificador || '—'}</td>
        </tr>
      `;
    }).join('');
  }

  function exportMovimientosToExcel() {
    if (!canExport()) {
      showToast('No tiene permisos para exportar reportes.', false);
      return;
    }

    const data = getFilteredMovimientos();
    if (data.length === 0) {
      showToast('No hay movimientos para exportar.', false);
      return;
    }

    const rows = data.map(m => ({
      'Fecha': m.fecha,
      'Tipo': m.tipo,
      'Material': m.materialNombre,
      'Área Usuaria': m.areaNombre,
      'Cantidad': m.tipo === 'INGRESO' ? m.cantidad : -m.cantidad,
      'Documento': m.documento,
      'NEA': m.nea || '—',
      'PECOSA': m.pecosa || '—',
      'Clasificador': m.clasificador || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    // Auto ajustar columnas
    const max_widths = Object.keys(rows[0]).map(key => {
      return Math.max(key.length, ...rows.map(row => String(row[key] || '').length)) + 2;
    });
    ws['!cols'] = max_widths.map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, "Movimientos Almacen");
    XLSX.writeFile(wb, `Reporte_Movimientos_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Historial de movimientos exportado correctamente.');
  }

  /* =========================================================================
     INITIALIZATION & ROUTER HOOK
     ========================================================================= */
  function setupRoleBadge() {
    const badgeContainer = document.getElementById('reportes-role-badge');
    if (badgeContainer) {
      const badgeClass = Auth.getRolBadgeClass(getRole());
      badgeContainer.innerHTML = `
        <span class="text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}">
          Rol: ${getRoleName()}
        </span>
      `;
    }
  }

  function init() {
    console.log("Reportes.init() called!");
    const module = document.getElementById('reportes-module');
    if (!module) return;

    setupRoleBadge();
    setupTabNavigation();

    // Activar primera pestaña (Dashboard)
    activeTab = 'dashboard';
    const firstTab = document.querySelector('.reportes-tab[data-tab="dashboard"]');
    if (firstTab) {
      document.querySelectorAll('.reportes-tab').forEach(t => t.classList.remove('active'));
      firstTab.classList.add('active');
    }
    document.querySelectorAll('.reportes-panel').forEach(p => p.classList.add('hidden'));
    const firstPanel = document.getElementById('panel-dashboard');
    if (firstPanel) firstPanel.classList.remove('hidden');

    // Inicializar contenido del Dashboard
    initDashboard();
  }

  function hookRouter() {
    if (!window.App || App.navigate._reportesHooked) return;

    const originalNavigate = App.navigate;
    App.navigate = function (route) {
      originalNavigate.call(App, route);
      if (route === 'reportes') {
        const observer = new MutationObserver((mutations, obs) => {
          if (document.getElementById('reportes-module')) {
            obs.disconnect();
            init();
          }
        });
        observer.observe(document.getElementById('main-content'), { childList: true, subtree: true });

        setTimeout(() => {
          if (document.getElementById('reportes-module')) {
            observer.disconnect();
            init();
          }
        }, 500);
      }
    };
    App.navigate._reportesHooked = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookRouter);
  } else {
    hookRouter();
  }

  return { init };
})();

window.Reportes = Reportes;
