/**
 * app.js — Inicialización, router y datos precargados
 * Sistema Logístico de Almacén Municipal
 */

const App = (() => {
  const STORAGE_KEYS = {
    areas: 'almacen_areas',
    materiales: 'almacen_materiales',
    responsables: 'almacen_responsables',
    clasificadores: 'almacen_clasificadores',
    ingresos: 'almacen_ingresos',
    salidas: 'almacen_salidas',
    initialized: 'almacen_initialized',
  };

  const ROUTES = {
    dashboard: { page: null, title: 'Panel Principal', icon: 'home' },
    maestros: { page: 'pages/maestros.html', title: 'Maestros', icon: 'database', modulo: 'maestros' },
    ingresos: { page: 'pages/ingresos.html', title: 'Ingresos', icon: 'arrow-down', modulo: 'ingresos' },
    salidas: { page: 'pages/salidas.html', title: 'Salidas', icon: 'arrow-up', modulo: 'salidas' },
    reportes: { page: 'pages/reportes.html', title: 'Reportes', icon: 'chart', modulo: 'reportes' },
  };

  let currentRoute = 'dashboard';

  /* ── Datos precargados: 15 áreas ── */
  const AREAS_INICIALES = [
    { id: 1, codigo: 'AR-001', nombre: 'Almacén Central', descripcion: 'Depósito principal municipal', activo: true },
    { id: 2, codigo: 'AR-002', nombre: 'Área de Oficina', descripcion: 'Suministros de oficina y papelería', activo: true },
    { id: 3, codigo: 'AR-003', nombre: 'Área de Limpieza', descripcion: 'Productos de aseo e higiene', activo: true },
    { id: 4, codigo: 'AR-004', nombre: 'Área de Mantenimiento', descripcion: 'Repuestos y materiales de mantenimiento', activo: true },
    { id: 5, codigo: 'AR-005', nombre: 'Área de Seguridad', descripcion: 'Equipos de protección y seguridad', activo: true },
    { id: 6, codigo: 'AR-006', nombre: 'Área Médica', descripcion: 'Insumos médicos y botiquines', activo: true },
    { id: 7, codigo: 'AR-007', nombre: 'Área de Tecnología', descripcion: 'Equipos informáticos y accesorios', activo: true },
    { id: 8, codigo: 'AR-008', nombre: 'Área de Construcción', descripcion: 'Materiales de construcción civil', activo: true },
    { id: 9, codigo: 'AR-009', nombre: 'Área de Jardinería', descripcion: 'Herramientas y productos de jardinería', activo: true },
    { id: 10, codigo: 'AR-010', nombre: 'Área de Alimentos', descripcion: 'Alimentos no perecederos', activo: true },
    { id: 11, codigo: 'AR-011', nombre: 'Área de Textiles', descripcion: 'Uniformes y telas', activo: true },
    { id: 12, codigo: 'AR-012', nombre: 'Área de Combustibles', descripcion: 'Combustibles y lubricantes', activo: true },
    { id: 13, codigo: 'AR-013', nombre: 'Área de Herramientas', descripcion: 'Herramientas manuales y eléctricas', activo: true },
    { id: 14, codigo: 'AR-014', nombre: 'Área de Archivo', descripcion: 'Material de archivo y documentación', activo: true },
    { id: 15, codigo: 'AR-015', nombre: 'Área de Residuos', descripcion: 'Contenedores y gestión de residuos', activo: true },
  ];

  /* ── Datos precargados: 34 materiales ── */
  const MATERIALES_INICIALES = [
    { id: 1, codigo: 'MAT-001', nombre: 'Resma de papel A4', unidad: 'Resma', stock: 450, stockMinimo: 100, areaId: 2, clasificador: 'Papelería', activo: true },
    { id: 2, codigo: 'MAT-002', nombre: 'Bolígrafo azul', unidad: 'Unidad', stock: 1200, stockMinimo: 200, areaId: 2, clasificador: 'Papelería', activo: true },
    { id: 3, codigo: 'MAT-003', nombre: 'Carpeta archivador', unidad: 'Unidad', stock: 320, stockMinimo: 50, areaId: 2, clasificador: 'Papelería', activo: true },
    { id: 4, codigo: 'MAT-004', nombre: 'Clips metálicos', unidad: 'Caja', stock: 85, stockMinimo: 20, areaId: 2, clasificador: 'Papelería', activo: true },
    { id: 5, codigo: 'MAT-005', nombre: 'Detergente líquido', unidad: 'Galón', stock: 60, stockMinimo: 15, areaId: 3, clasificador: 'Limpieza', activo: true },
    { id: 6, codigo: 'MAT-006', nombre: 'Escoba industrial', unidad: 'Unidad', stock: 45, stockMinimo: 10, areaId: 3, clasificador: 'Limpieza', activo: true },
    { id: 7, codigo: 'MAT-007', nombre: 'Desinfectante', unidad: 'Litro', stock: 120, stockMinimo: 30, areaId: 3, clasificador: 'Limpieza', activo: true },
    { id: 8, codigo: 'MAT-008', nombre: 'Guantes de latex', unidad: 'Caja', stock: 200, stockMinimo: 40, areaId: 3, clasificador: 'Limpieza', activo: true },
    { id: 9, codigo: 'MAT-009', nombre: 'Pintura blanca', unidad: 'Galón', stock: 35, stockMinimo: 10, areaId: 4, clasificador: 'Mantenimiento', activo: true },
    { id: 10, codigo: 'MAT-010', nombre: 'Brocha 4 pulgadas', unidad: 'Unidad', stock: 28, stockMinimo: 8, areaId: 4, clasificador: 'Mantenimiento', activo: true },
    { id: 11, codigo: 'MAT-011', nombre: 'Tubería PVC 2"', unidad: 'Metro', stock: 150, stockMinimo: 30, areaId: 4, clasificador: 'Mantenimiento', activo: true },
    { id: 12, codigo: 'MAT-012', nombre: 'Casco de seguridad', unidad: 'Unidad', stock: 80, stockMinimo: 20, areaId: 5, clasificador: 'EPP', activo: true },
    { id: 13, codigo: 'MAT-013', nombre: 'Chaleco reflectivo', unidad: 'Unidad', stock: 65, stockMinimo: 15, areaId: 5, clasificador: 'EPP', activo: true },
    { id: 14, codigo: 'MAT-014', nombre: 'Extintor PQS 6kg', unidad: 'Unidad', stock: 42, stockMinimo: 10, areaId: 5, clasificador: 'Seguridad', activo: true },
    { id: 15, codigo: 'MAT-015', nombre: 'Vendas elásticas', unidad: 'Unidad', stock: 90, stockMinimo: 25, areaId: 6, clasificador: 'Médico', activo: true },
    { id: 16, codigo: 'MAT-016', nombre: 'Alcohol medicinal', unidad: 'Litro', stock: 55, stockMinimo: 15, areaId: 6, clasificador: 'Médico', activo: true },
    { id: 17, codigo: 'MAT-017', nombre: 'Botiquín de primeros auxilios', unidad: 'Kit', stock: 25, stockMinimo: 5, areaId: 6, clasificador: 'Médico', activo: true },
    { id: 18, codigo: 'MAT-018', nombre: 'Cable UTP Cat6', unidad: 'Metro', stock: 500, stockMinimo: 100, areaId: 7, clasificador: 'Tecnología', activo: true },
    { id: 19, codigo: 'MAT-019', nombre: 'Mouse óptico USB', unidad: 'Unidad', stock: 75, stockMinimo: 15, areaId: 7, clasificador: 'Tecnología', activo: true },
    { id: 20, codigo: 'MAT-020', nombre: 'Teclado estándar', unidad: 'Unidad', stock: 60, stockMinimo: 12, areaId: 7, clasificador: 'Tecnología', activo: true },
    { id: 21, codigo: 'MAT-021', nombre: 'Cemento Portland', unidad: 'Bolsa', stock: 200, stockMinimo: 50, areaId: 8, clasificador: 'Construcción', activo: true },
    { id: 22, codigo: 'MAT-022', nombre: 'Arena fina', unidad: 'm³', stock: 15, stockMinimo: 3, areaId: 8, clasificador: 'Construcción', activo: true },
    { id: 23, codigo: 'MAT-023', nombre: 'Ladrillo king kong', unidad: 'Millar', stock: 8, stockMinimo: 2, areaId: 8, clasificador: 'Construcción', activo: true },
    { id: 24, codigo: 'MAT-024', nombre: 'Fertilizante NPK', unidad: 'Kg', stock: 180, stockMinimo: 40, areaId: 9, clasificador: 'Jardinería', activo: true },
    { id: 25, codigo: 'MAT-025', nombre: 'Manguera de riego', unidad: 'Metro', stock: 100, stockMinimo: 20, areaId: 9, clasificador: 'Jardinería', activo: true },
    { id: 26, codigo: 'MAT-026', nombre: 'Arroz extra', unidad: 'Kg', stock: 500, stockMinimo: 100, areaId: 10, clasificador: 'Alimentos', activo: true },
    { id: 27, codigo: 'MAT-027', nombre: 'Aceite vegetal', unidad: 'Litro', stock: 120, stockMinimo: 30, areaId: 10, clasificador: 'Alimentos', activo: true },
    { id: 28, codigo: 'MAT-028', nombre: 'Uniforme operativo', unidad: 'Unidad', stock: 150, stockMinimo: 30, areaId: 11, clasificador: 'Textiles', activo: true },
    { id: 29, codigo: 'MAT-029', nombre: 'Gasolina regular', unidad: 'Galón', stock: 800, stockMinimo: 200, areaId: 12, clasificador: 'Combustibles', activo: true },
    { id: 30, codigo: 'MAT-030', nombre: 'Aceite motor 15W40', unidad: 'Litro', stock: 95, stockMinimo: 20, areaId: 12, clasificador: 'Combustibles', activo: true },
    { id: 31, codigo: 'MAT-031', nombre: 'Martillo de uña', unidad: 'Unidad', stock: 40, stockMinimo: 10, areaId: 13, clasificador: 'Herramientas', activo: true },
    { id: 32, codigo: 'MAT-032', nombre: 'Taladro eléctrico', unidad: 'Unidad', stock: 12, stockMinimo: 3, areaId: 13, clasificador: 'Herramientas', activo: true },
    { id: 33, codigo: 'MAT-033', nombre: 'Caja de archivo legal', unidad: 'Unidad', stock: 280, stockMinimo: 60, areaId: 14, clasificador: 'Archivo', activo: true },
    { id: 34, codigo: 'MAT-034', nombre: 'Contenedor basura 240L', unidad: 'Unidad', stock: 35, stockMinimo: 8, areaId: 15, clasificador: 'Residuos', activo: true },
  ];

  const RESPONSABLES_INICIALES = [
    { id: 1, codigo: 'RES-001', nombre: 'Juan Pérez García', cargo: 'Jefe de Almacén', areaId: 1, activo: true },
    { id: 2, codigo: 'RES-002', nombre: 'Ana Torres Ruiz', cargo: 'Encargada de Oficina', areaId: 2, activo: true },
    { id: 3, codigo: 'RES-003', nombre: 'Luis Ramírez Soto', cargo: 'Supervisor de Mantenimiento', areaId: 4, activo: true },
  ];

  const CLASIFICADORES_INICIALES = [
    { id: 1, codigo: 'CL-001', nombre: 'Papelería', descripcion: 'Artículos de oficina' },
    { id: 2, codigo: 'CL-002', nombre: 'Limpieza', descripcion: 'Productos de aseo' },
    { id: 3, codigo: 'CL-003', nombre: 'Mantenimiento', descripcion: 'Materiales de mantenimiento' },
    { id: 4, codigo: 'CL-004', nombre: 'EPP', descripcion: 'Equipos de protección personal' },
    { id: 5, codigo: 'CL-005', nombre: 'Construcción', descripcion: 'Materiales de construcción' },
  ];

  function initStorage() {
    if (localStorage.getItem(STORAGE_KEYS.initialized)) return;

    localStorage.setItem(STORAGE_KEYS.areas, JSON.stringify(AREAS_INICIALES));
    localStorage.setItem(STORAGE_KEYS.materiales, JSON.stringify(MATERIALES_INICIALES));
    localStorage.setItem(STORAGE_KEYS.responsables, JSON.stringify(RESPONSABLES_INICIALES));
    localStorage.setItem(STORAGE_KEYS.clasificadores, JSON.stringify(CLASIFICADORES_INICIALES));
    localStorage.setItem(STORAGE_KEYS.ingresos, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.salidas, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }

  function getData(key) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS[key]);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function setData(key, data) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  }

  function getAreaNombre(areaId) {
    const areas = getData('areas');
    const area = areas.find((a) => a.id === areaId);
    return area ? area.nombre : 'Sin área';
  }

  function getMaterialesBajoStock() {
    return getData('materiales').filter((m) => m.stock <= m.stockMinimo);
  }

  /* ── Router ── */
  function navigate(route) {
    if (!ROUTES[route]) route = 'dashboard';
    currentRoute = route;

    document.querySelectorAll('.sidebar-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.route === route);
    });

    const titleEl = document.getElementById('page-title');
    const breadcrumbEl = document.getElementById('page-breadcrumb');
    const config = ROUTES[route];

    if (titleEl) titleEl.textContent = config.title;
    if (breadcrumbEl) breadcrumbEl.textContent = config.title;

    if (config.modulo && !Auth.hasPermission(config.modulo)) {
      renderAccessDenied();
      return;
    }

    if (route === 'dashboard') {
      renderDashboard();
    } else if (config.page) {
      loadPage(config.page).then(() => {
        if (route === 'maestros' && window.Maestros) {
          window.Maestros.init();
        }
      });
    }
  }

  function renderAccessDenied() {
    const container = document.getElementById('main-content');
    if (!container) return;
    container.innerHTML = `
      <div class="page-placeholder page-enter">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h3 class="text-lg font-semibold text-slate-700 mb-1">Acceso restringido</h3>
        <p class="text-sm">No tiene permisos para acceder a este módulo.</p>
      </div>`;
  }

  async function loadPage(pagePath) {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

    try {
      let html = '';
      const templateId = 'tpl-' + pagePath.replace('pages/', '').replace('.html', '');
      const template = document.getElementById(templateId);
      if (template && window.location.protocol === 'file:') {
        html = template.innerHTML;
      } else {
        const response = await fetch(pagePath + '?v=' + Date.now());
        if (!response.ok) throw new Error('Página no encontrada');
        html = await response.text();
      }
      container.innerHTML = `<div class="page-enter">${html}</div>`;
    } catch (err) {
      console.error("Error loading page:", err);
      container.innerHTML = `
        <div class="page-placeholder page-enter">
          <h3 class="text-lg font-semibold text-slate-700">Error al cargar la página</h3>
          <p class="text-sm">No se pudo cargar ${pagePath}. Detalle: ${err.message || err}</p>
        </div>`;
    }
  }

  function renderDashboard() {
    const materiales = getData('materiales');
    const areas = getData('areas');
    const bajoStock = getMaterialesBajoStock();
    const stockTotal = materiales.reduce((sum, m) => sum + m.stock, 0);

    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="page-enter space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="stat-card">
            <p class="text-sm text-slate-500 mb-1">Total Materiales</p>
            <p class="text-3xl font-bold text-blue-800">${materiales.length}</p>
          </div>
          <div class="stat-card">
            <p class="text-sm text-slate-500 mb-1">Áreas Registradas</p>
            <p class="text-3xl font-bold text-blue-800">${areas.length}</p>
          </div>
          <div class="stat-card">
            <p class="text-sm text-slate-500 mb-1">Unidades en Stock</p>
            <p class="text-3xl font-bold text-blue-800">${stockTotal.toLocaleString('es-PE')}</p>
          </div>
          <div class="stat-card">
            <p class="text-sm text-slate-500 mb-1">Alertas de Stock</p>
            <p class="text-3xl font-bold ${bajoStock.length > 0 ? 'text-red-600' : 'text-green-600'}">${bajoStock.length}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="text-base font-semibold text-slate-800 mb-4">Materiales con stock bajo</h3>
            ${bajoStock.length === 0
              ? '<p class="text-sm text-green-600">Todos los materiales tienen stock suficiente.</p>'
              : `<ul class="space-y-2">${bajoStock.slice(0, 5).map((m) => `
                  <li class="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                    <span class="text-slate-700">${m.nombre}</span>
                    <span class="text-red-600 font-medium">${m.stock} / ${m.stockMinimo} ${m.unidad}</span>
                  </li>`).join('')}</ul>`}
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="text-base font-semibold text-slate-800 mb-4">Accesos rápidos</h3>
            <div class="grid grid-cols-2 gap-3">
              ${Object.entries(ROUTES).filter(([k]) => k !== 'dashboard').map(([key, r]) => {
                if (r.modulo && !Auth.hasPermission(r.modulo)) return '';
                return `<button onclick="App.navigate('${key}')"
                  class="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-sm font-medium text-slate-700">
                  ${r.title}
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="text-base font-semibold text-slate-800 mb-4">Últimos materiales registrados</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-slate-500 border-b border-slate-200">
                  <th class="pb-3 font-medium">Código</th>
                  <th class="pb-3 font-medium">Material</th>
                  <th class="pb-3 font-medium">Área</th>
                  <th class="pb-3 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                ${materiales.slice(-8).reverse().map((m) => `
                  <tr class="border-b border-slate-50 hover:bg-slate-50">
                    <td class="py-2.5 text-blue-700 font-mono text-xs">${m.codigo}</td>
                    <td class="py-2.5 text-slate-700">${m.nombre}</td>
                    <td class="py-2.5 text-slate-500">${getAreaNombre(m.areaId)}</td>
                    <td class="py-2.5 text-right font-medium ${m.stock <= m.stockMinimo ? 'text-red-600' : 'text-slate-700'}">${m.stock} ${m.unidad}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function initSidebar() {
    document.querySelectorAll('.sidebar-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        if (route) App.navigate(route);

        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.add('hidden');
      });
    });

    const menuBtn = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('hidden');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay.classList.add('hidden');
      });
    }
  }

  function filterSidebarByRole() {
    document.querySelectorAll('.sidebar-link[data-modulo]').forEach((link) => {
      const modulo = link.dataset.modulo;
      if (modulo && !Auth.hasPermission(modulo)) {
        link.style.display = 'none';
      }
    });
  }

  function init() {
    if (!Auth.requireAuth()) return;

    initStorage();
    Auth.updateHeaderUI();
    Auth.initLogoutButton();
    filterSidebarByRole();
    initSidebar();
    App.navigate('dashboard');
  }

  return {
    init,
    navigate,
    getData,
    setData,
    getAreaNombre,
    getMaterialesBajoStock,
    STORAGE_KEYS,
    ROUTES,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('app-shell')) {
    App.init();
  }
});

window.App = App;
