/**
 * auth.js — Autenticación, sesión y control de roles
 * Sistema Logístico de Almacén Municipal
 */

const Auth = (() => {
  const SESSION_KEY = 'almacen_session';

  function isInPagesFolder() {
    return /\/pages\//.test(window.location.pathname) ||
      window.location.href.includes('/pages/');
  }

  function getLoginPage() {
    return isInPagesFolder() ? 'login.html' : 'pages/login.html';
  }

  function getHomePage() {
    return isInPagesFolder() ? '../index.html' : 'index.html';
  }

  const USUARIOS = [
    {
      username: 'admin',
      password: 'admin123',
      nombre: 'Administrador del Sistema',
      rol: 'Administrador',
      rolKey: 'admin',
    },
    {
      username: 'gerente',
      password: 'gerente123',
      nombre: 'Carlos Mendoza',
      rol: 'Gerente',
      rolKey: 'gerente',
    },
    {
      username: 'asistente',
      password: 'asistente123',
      nombre: 'María López',
      rol: 'Asistente',
      rolKey: 'asistente',
    },
  ];

  const PERMISOS = {
    admin: ['maestros', 'ingresos', 'salidas', 'reportes', 'configuracion'],
    gerente: ['maestros', 'ingresos', 'salidas', 'reportes'],
    asistente: ['ingresos', 'salidas', 'reportes'],
  };

  function getSession() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function saveSession(usuario) {
    const session = {
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      rolKey: usuario.rolKey,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function login(username, password) {
    const usuario = USUARIOS.find(
      (u) => u.username === username.trim() && u.password === password
    );

    if (!usuario) {
      return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    const session = saveSession(usuario);
    return { success: true, session };
  }

  function logout() {
    clearSession();
    window.location.href = getLoginPage();
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = getLoginPage();
      return false;
    }
    return true;
  }

  function redirectIfAuthenticated() {
    if (isAuthenticated()) {
      window.location.href = getHomePage();
      return true;
    }
    return false;
  }

  function hasPermission(modulo) {
    const session = getSession();
    if (!session) return false;
    const permisos = PERMISOS[session.rolKey] || [];
    return permisos.includes(modulo);
  }

  function getRolBadgeClass(rolKey) {
    const clases = {
      admin: 'badge-admin',
      gerente: 'badge-gerente',
      asistente: 'badge-asistente',
    };
    return clases[rolKey] || 'badge-asistente';
  }

  function initLoginForm() {
    if (redirectIfAuthenticated()) return;

    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorBox) errorBox.classList.add('hidden');

      const username = document.getElementById('username')?.value || '';
      const password = document.getElementById('password')?.value || '';

      if (!username || !password) {
        showLoginError('Por favor, complete todos los campos.');
        return;
      }

      const result = login(username, password);

      if (result.success) {
        window.location.href = getHomePage();
      } else {
        showLoginError(result.message);
      }
    });

    function showLoginError(message) {
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.classList.remove('hidden');
      }
    }
  }

  function updateHeaderUI() {
    const session = getSession();
    if (!session) return;

    const nombreEl = document.getElementById('user-name');
    const rolEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');

    if (nombreEl) nombreEl.textContent = session.nombre;
    if (rolEl) {
      rolEl.textContent = session.rol;
      rolEl.className = `text-xs font-semibold px-2 py-0.5 rounded-full ${getRolBadgeClass(session.rolKey)}`;
    }
    if (avatarEl) {
      const iniciales = session.nombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.textContent = iniciales;
    }
  }

  function initLogoutButton() {
    const btn = document.getElementById('btn-logout');
    if (btn) {
      btn.addEventListener('click', logout);
    }
  }

  return {
    login,
    logout,
    getSession,
    isAuthenticated,
    requireAuth,
    redirectIfAuthenticated,
    hasPermission,
    getRolBadgeClass,
    initLoginForm,
    updateHeaderUI,
    initLogoutButton,
    PERMISOS,
  };
})();

window.Auth = Auth;
