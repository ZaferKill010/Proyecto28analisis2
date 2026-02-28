// ============================================================
//  App.jsx — Raíz de la aplicación y configuración de rutas
// ============================================================
//  Este componente:
//    1. Envuelve todo con los providers necesarios
//    2. Define las rutas de navegación con React Router
//    3. Protege las rutas privadas (requieren login)
//    4. Redirige las rutas públicas si ya estás logueado
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout        from './components/Layout';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage   from './pages/ProjectPage';

// ── Spinner de carga ──────────────────────────────────────────
// Mientras AuthContext verifica el token, mostramos esto
const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#09090f' }}>
    <div style={{ width:38, height:38, border:'3px solid #272740', borderTopColor:'#7c6fff', borderRadius:'50%' }} className="spin"/>
  </div>
);

// ── Ruta Privada ──────────────────────────────────────────────
// Si el usuario NO está logueado, redirige a /login.
// Si SÍ está logueado, renderiza los hijos normalmente.
// "loading" evita un parpadeo mientras se verifica el token.
const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />; // Esperamos la verificación del token
  return user ? children : <Navigate to="/login" replace />;
  // replace=true reemplaza la entrada en el historial (no se puede volver con "atrás")
};

// ── Ruta Pública ──────────────────────────────────────────────
// Si el usuario YA está logueado, no tiene sentido ir a /login o /register.
// Lo redirigimos al dashboard.
const Public = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

// ── Componente raíz ───────────────────────────────────────────
export default function App() {
  return (
    // AuthProvider: hace disponible el contexto de auth en toda la app
    <AuthProvider>
      {/* BrowserRouter: habilita la navegación con URLs reales (/login, /project/123) */}
      <BrowserRouter>

        {/* Toaster: sistema de notificaciones (toast) en la esquina superior derecha */}
        <Toaster position="top-right" toastOptions={{
          style: { background:'#18182a', color:'#eeeef8', border:'1px solid #272740', fontFamily:'Instrument Sans,sans-serif', fontSize:14 },
          success: { iconTheme: { primary:'#34d399', secondary:'#09090f' } },
          error:   { iconTheme: { primary:'#f87171', secondary:'#09090f' } },
        }}/>

        <Routes>
          {/* Rutas públicas: solo accesibles SIN login */}
          <Route path="/login"    element={<Public><LoginPage /></Public>} />
          <Route path="/register" element={<Public><RegisterPage /></Public>} />

          {/* Ruta privada raíz: requiere login */}
          {/* Layout es el shell con sidebar. Outlet renderiza la ruta hija activa */}
          <Route path="/" element={<Private><Layout /></Private>}>
            {/* Ruta índice → /  → Dashboard */}
            <Route index                  element={<DashboardPage />} />
            {/* Ruta dinámica → /project/proj-1 → Tablero del proyecto */}
            {/* :id es un parámetro de URL accesible con useParams() */}
            <Route path="project/:id"     element={<ProjectPage />} />
          </Route>
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}
