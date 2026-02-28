// ============================================================
//  context/AuthContext.jsx — Estado global de autenticación
// ============================================================
//  React Context es como una "variable global" para componentes.
//  Sin Context, para pasar el usuario de un componente padre a
//  un hijo muy profundo tendríamos que pasar props por CADA nivel.
//  Con Context, cualquier componente puede acceder a { user }
//  directamente sin importar dónde esté en el árbol.
//
//  ¿Qué guarda este contexto?
//    - user: el objeto del usuario logueado (o null)
//    - loading: true mientras verifica si hay sesión activa
//    - login(), register(), logout(): funciones de autenticación
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// 1. Creamos el contexto vacío (null es el valor por defecto inicial)
const Ctx = createContext(null);

// 2. El Provider es el componente que "envuelve" toda la app
//    y hace disponibles los valores a todos sus descendientes
export function AuthProvider({ children }) {
  // Intentamos leer el usuario del localStorage para no perder
  // la sesión al recargar la página.
  // try/catch por si localStorage tiene datos corruptos
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')); }
    catch { return null; }
  });

  // loading = true mientras verificamos si el token sigue siendo válido
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta una sola vez al montar el componente (array [] vacío)
  // Verifica si el token guardado sigue siendo válido en el servidor
  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      // Llamamos a GET /api/auth/me para verificar el token
      authAPI.me()
        .then(r => {
          // Token válido → actualizamos el usuario con datos frescos del servidor
          setUser(r.data.user);
          localStorage.setItem('tf_user', JSON.stringify(r.data.user));
        })
        .catch(() => {
          // Token inválido o expirado → limpiamos todo
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false)); // En cualquier caso, dejamos de cargar
    } else {
      setLoading(false); // No hay token → no hay sesión, pero ya terminamos de verificar
    }
  }, []); // [] = solo al montar, no en cada re-render

  // ── login: inicia sesión con email y password ──────────────
  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    // Guardamos token y usuario en localStorage para persistir entre recargas
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user', JSON.stringify(r.data.user));
    setUser(r.data.user); // Actualizamos el estado de React (re-renderiza los componentes)
  };

  // ── register: crea cuenta e inicia sesión automáticamente ──
  const register = async (data) => {
    const r = await authAPI.register(data);
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
  };

  // ── logout: cierra sesión ──────────────────────────────────
  const logout = () => {
    localStorage.clear(); // Borra token y usuario guardados
    setUser(null);        // React re-renderiza → rutas privadas redirigen a /login
  };

  // 3. Proveemos los valores a todos los componentes hijos
  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

// 4. Hook personalizado para consumir el contexto fácilmente
//    Uso en cualquier componente: const { user, logout } = useAuth();
export const useAuth = () => useContext(Ctx);
