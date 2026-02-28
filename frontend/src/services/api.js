// ============================================================
//  services/api.js — Cliente HTTP centralizado con Axios
// ============================================================
//  Este archivo es el "puente" entre el frontend y el backend.
//  En vez de escribir fetch() en cada componente, tenemos
//  una instancia configurada de Axios que:
//    1. Apunta siempre a /api (que Vite redirige a localhost:5000)
//    2. Agrega el token JWT automáticamente a cada request
//    3. Redirige al login si el token expira (error 401)
// ============================================================

import axios from 'axios';

// ── Creamos una instancia de Axios con configuración base ─────
// baseURL: '/api' → todas las rutas son relativas, ej: '/tasks' → '/api/tasks'
// timeout: 10000 → si el servidor no responde en 10s, cancela la petición
const api = axios.create({ baseURL: '/api', timeout: 10000 });

// ── Interceptor de REQUEST ────────────────────────────────────
// Se ejecuta ANTES de cada petición HTTP.
// Su función: agregar el token JWT al header "Authorization".
api.interceptors.request.use(cfg => {
  // Leemos el token guardado en localStorage (lo guardamos al hacer login)
  const token = localStorage.getItem('tf_token');
  // Si existe, lo adjuntamos en el formato "Bearer <token>"
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg; // Devolvemos la config modificada para que Axios la use
});

// ── Interceptor de RESPONSE ───────────────────────────────────
// Se ejecuta DESPUÉS de recibir cada respuesta HTTP.
// Su función: detectar errores de autenticación y redirigir al login.
api.interceptors.response.use(
  r => r, // Si la respuesta es exitosa, la pasamos sin modificar
  err => {
    // Si el backend responde con 401 (token inválido o expirado)
    if (err.response?.status === 401) {
      localStorage.clear();           // Borramos el token guardado
      window.location.href = '/login'; // Forzamos redirect al login
    }
    return Promise.reject(err); // Propagamos el error para que el componente lo maneje
  }
);

// ── Grupos de métodos por entidad ─────────────────────────────
// Organizamos las llamadas por "recurso" para tener claridad.
// Cada función retorna una Promise con la respuesta de Axios.

// Autenticación
export const authAPI = {
  login:    d  => api.post('/auth/login', d),    // d = { email, password }
  register: d  => api.post('/auth/register', d), // d = { name, email, password, role }
  me:       () => api.get('/auth/me'),           // Verifica token activo
};

// Usuarios
export const usersAPI = {
  getAll:   ()  => api.get('/users'),             // Lista todos los usuarios
  updateMe: d   => api.put('/users/me', d),       // Actualiza perfil propio
};

// Proyectos
export const projectsAPI = {
  getAll:    ()         => api.get('/projects'),
  getOne:    id         => api.get(`/projects/${id}`),
  create:    d          => api.post('/projects', d),
  update:    (id, d)    => api.put(`/projects/${id}`, d),
  delete:    id         => api.delete(`/projects/${id}`),
  addMember: (id, email) => api.post(`/projects/${id}/members`, { email }),
};

// Tareas
export const tasksAPI = {
  getAll:       p        => api.get('/tasks', { params: p }),    // p = query params (filtros)
  getOne:       id       => api.get(`/tasks/${id}`),
  create:       d        => api.post('/tasks', d),
  update:       (id, d)  => api.put(`/tasks/${id}`, d),
  updateStatus: (id, s)  => api.put(`/tasks/${id}/status`, { status: s }), // Cambio rápido
  delete:       id       => api.delete(`/tasks/${id}`),
  addComment:   (id, t)  => api.post(`/tasks/${id}/comments`, { text: t }),
};

export default api;
