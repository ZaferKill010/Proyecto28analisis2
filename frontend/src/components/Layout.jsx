// ============================================================
//  components/Layout.jsx — Shell principal de la app
// ============================================================
//  Este componente es el "marco" que siempre está visible
//  cuando el usuario está logueado. Contiene:
//    - Sidebar izquierda (navegación + lista de proyectos)
//    - Área principal derecha (donde se renderizan las páginas)
//
//  Usa <Outlet /> de React Router para renderizar la página activa
//  (Dashboard o ProjectPage) en el área principal.
// ============================================================

import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import { LayoutDashboard, Plus, LogOut, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateProjectModal from './CreateProjectModal';
import { Avatar } from './ui';

export default function Layout() {
  const { user, logout }    = useAuth();
  const location            = useLocation();  // Para saber qué ruta está activa
  const navigate            = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showNew, setShowNew]   = useState(false); // Controla el modal de nuevo proyecto

  // Cargamos la lista de proyectos al montar el componente
  useEffect(() => { load(); }, []);

  const load = () =>
    projectsAPI.getAll()
      .then(r => setProjects(r.data.projects))
      .catch(() => {}); // Silenciamos errores de carga (no bloqueamos la UI)

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{
        width:248, minWidth:248,
        background:'var(--surface)',
        borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        position:'sticky', top:0,   // Se queda fijo al hacer scroll
        height:'100vh', overflow:'hidden',
      }}>

        {/* Logo del producto */}
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c6fff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="#fff" fill="#fff"/>
          </div>
          <span style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:17, letterSpacing:'-0.5px' }}>TaskFlow</span>
        </div>

        {/* Navegación principal */}
        <nav style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>

          {/* Enlace al Dashboard */}
          <NavItem
            to="/"
            icon={<LayoutDashboard size={15}/>}
            label="Dashboard"
            active={location.pathname === '/'}  // Marcamos como activo si estamos en "/"
          />

          {/* Separador de sección */}
          <div style={{ margin:'18px 8px 6px', fontSize:10, fontFamily:'var(--font-m)', color:'var(--muted)', textTransform:'uppercase', letterSpacing:2 }}>
            Proyectos
          </div>

          {/* Un NavItem por cada proyecto del usuario */}
          {projects.map(p => (
            <NavItem
              key={p.id}
              to={`/project/${p.id}`}
              icon={<span style={{fontSize:14}}>{p.icon}</span>}
              label={p.name}
              sub={p.key}       // Subtexto: la clave del proyecto
              active={location.pathname.includes(p.id)}
              badge={p.stats?.in_progress || 0}  // Número de tareas en progreso
            />
          ))}

          {/* Botón para crear nuevo proyecto */}
          <button
            onClick={() => setShowNew(true)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', width:'100%', borderRadius:'var(--r-sm)', background:'none', border:'1px dashed var(--border)', color:'var(--muted)', fontSize:12, cursor:'pointer', marginTop:8, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; }}
          >
            <Plus size={13}/> Nuevo proyecto
          </button>
        </nav>

        {/* Pie del sidebar: info del usuario + logout */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'10px 8px' }}>
          {/* Datos del usuario logueado */}
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', borderRadius:'var(--r-sm)', marginBottom:2 }}>
            <Avatar user={user} size={28}/>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-m)' }}>{user?.role}</div>
            </div>
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', width:'100%', borderRadius:'var(--r-sm)', background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,.08)'; e.currentTarget.style.color='#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--muted)'; }}
          >
            <LogOut size={14}/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ──────────────────────────────────── */}
      <main style={{ flex:1, overflow:'auto' }}>
        {/*
          Outlet renderiza la página hija según la ruta activa:
            /              → <DashboardPage />
            /project/:id   → <ProjectPage />

          context={{ reloadProjects: load }} permite a las páginas hijas
          llamar a load() para refrescar la lista de proyectos en el sidebar.
          Uso: const { reloadProjects } = useOutletContext();
        */}
        <Outlet context={{ reloadProjects: load }} />
      </main>

      {/* Modal para crear proyecto (se muestra condicionalmente) */}
      {showNew && (
        <CreateProjectModal
          onClose={() => setShowNew(false)}
          onCreated={() => { load(); setShowNew(false); }}  // Recarga proyectos al crear
        />
      )}
    </div>
  );
}

// ── NavItem: elemento de navegación en el sidebar ────────────
// Componente auxiliar para mantener el código limpio.
function NavItem({ to, icon, label, sub, active, badge }) {
  return (
    <Link
      to={to}
      style={{
        display:'flex', alignItems:'center', gap:9, padding:'7px 12px',
        borderRadius:'var(--r-sm)', marginBottom:2,
        background: active ? 'rgba(124,111,255,.12)' : 'none',
        color:      active ? 'var(--accent2)' : 'var(--muted)',
        fontSize:13, fontWeight: active ? 600 : 400,
        transition:'all .15s',
        // Borde izquierdo coloreado para el item activo
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        textDecoration:'none',
      }}
      // Hover: solo cambia si NO está activo (el activo ya tiene su estilo)
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--muted)'; } }}
    >
      {icon}
      <div style={{ flex:1, overflow:'hidden' }}>
        {/* Texto principal (nombre del proyecto o sección) */}
        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
        {/* Subtexto opcional (clave del proyecto) */}
        {sub && <div style={{ fontSize:10, fontFamily:'var(--font-m)', opacity:.6 }}>{sub}</div>}
      </div>
      {/* Badge: número de tareas en progreso */}
      {badge > 0 && (
        <span style={{ background:'var(--accent)', color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}
