// ============================================================
//  pages/ProjectPage.jsx — Tablero Kanban del proyecto
// ============================================================
//  Esta es la página más importante de la app.
//  Muestra el tablero tipo Jira con 4 columnas:
//    Todo → En Progreso → En Revisión → Listo
//
//  Funcionalidades:
//    - Cargar y mostrar todas las tareas del proyecto
//    - Filtrar por texto, asignado y prioridad
//    - Crear nuevas tareas
//    - Cambiar estado de tareas directamente
//    - Abrir modal de detalle/edición
// ============================================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskCard        from '../components/TaskCard';
import TaskModal       from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { Avatar } from '../components/ui';

// Definición de las 4 columnas del tablero Kanban
// cada objeto tiene: id (igual al status de la tarea), etiqueta, color y símbolo visual
const COLS = [
  { id:'todo',        label:'Por Hacer',   color:'#8080a8', dot:'○' },
  { id:'in_progress', label:'En Progreso',  color:'#fbbf24', dot:'◐' },
  { id:'in_review',   label:'En Revisión',  color:'#60a5fa', dot:'◑' },
  { id:'done',        label:'Listo',        color:'#34d399', dot:'●' },
];

export default function ProjectPage() {
  // useParams lee el :id de la URL (/project/proj-1 → id = 'proj-1')
  const { id } = useParams();

  // Estado local del componente
  const [project,  setProject]  = useState(null);   // Datos del proyecto actual
  const [tasks,    setTasks]    = useState([]);      // Todas las tareas del proyecto
  const [users,    setUsers]    = useState([]);      // Usuarios disponibles para filtros
  const [loading,  setLoading]  = useState(true);   // Estado de carga inicial
  const [selected, setSelected] = useState(null);   // Tarea seleccionada para el modal de detalle
  const [showCreate, setShowCreate] = useState(false);      // Mostrar modal de crear tarea
  const [createStatus, setCreateStatus] = useState('todo'); // Estado inicial al crear

  // Estados de los filtros
  const [search,    setSearch]    = useState('');  // Búsqueda por texto en el título
  const [fAssignee, setFAssignee] = useState('');  // Filtro por usuario asignado
  const [fPriority, setFPriority] = useState('');  // Filtro por prioridad

  // Recargamos cuando cambia el :id en la URL (navegamos a otro proyecto)
  useEffect(() => { loadAll(); }, [id]);

  // ── Carga inicial de datos ──────────────────────────────────
  // Hacemos 3 llamadas en paralelo con Promise.all para ser más rápidos
  const loadAll = async () => {
    setLoading(true);
    try {
      const [pr, tr, ur] = await Promise.all([
        projectsAPI.getOne(id),       // Datos del proyecto
        tasksAPI.getAll({ projectId: id }), // Tareas del proyecto
        usersAPI.getAll(),            // Todos los usuarios (para filtros y asignación)
      ]);
      setProject(pr.data.project);
      setTasks(tr.data.tasks);
      setUsers(ur.data.users);
    } catch { toast.error('Error cargando proyecto'); }
    finally { setLoading(false); }
  };

  // ── Cambio de estado de una tarea ──────────────────────────
  // Usamos "optimistic update": actualizamos la UI ANTES de la respuesta del servidor.
  // Si el servidor falla, revertimos el cambio.
  const handleStatusChange = async (taskId, status) => {
    const prev = tasks.find(t => t.id === taskId)?.status; // Guardamos el estado anterior

    // 1. Actualizamos la UI inmediatamente (sin esperar al servidor)
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      // 2. Enviamos el cambio al servidor
      await tasksAPI.updateStatus(taskId, status);
    } catch {
      // 3. Si falló, revertimos al estado anterior
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: prev } : t));
      toast.error('Error');
    }
  };

  // ── Eliminar tarea ──────────────────────────────────────────
  const handleDelete = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return; // Confirmación nativa del navegador

    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId)); // Removemos de la lista local
      setSelected(null); // Cerramos el modal de detalle
      toast.success('Tarea eliminada');
    } catch { toast.error('Error'); }
  };

  // ── Tarea creada exitosamente ───────────────────────────────
  // Agregamos la nueva tarea al estado sin recargar todo
  const handleCreated = t => {
    setTasks([...tasks, t]);
    setShowCreate(false);
    toast.success('Tarea creada');
  };

  // ── Tarea actualizada ───────────────────────────────────────
  // Reemplazamos la tarea vieja por la actualizada en el array
  const handleUpdated = t => {
    setTasks(tasks.map(x => x.id === t.id ? t : x));
    setSelected(t); // Actualizamos también el modal abierto
  };

  // ── Aplicar filtros ─────────────────────────────────────────
  // Filtramos el array de tareas según los filtros activos
  const filtered = tasks.filter(t => {
    // Filtro de texto: buscamos en el título (case-insensitive)
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Filtro "sin asignar"
    if (fAssignee === 'none' && t.assignee?.id) return false;
    // Filtro por ID de asignado
    if (fAssignee && fAssignee !== 'none' && t.assignee?.id !== fAssignee) return false;
    // Filtro por prioridad
    if (fPriority && t.priority !== fPriority) return false;
    return true; // Si pasa todos los filtros, la incluimos
  });

  // Helper: obtener las tareas filtradas de una columna específica
  const col = (status) => filtered.filter(t => t.status === status);

  // ── Renders condicionales ───────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%' }} className="spin"/>
    </div>
  );

  if (!project) return <div style={{ padding:40, color:'var(--muted)' }}>Proyecto no encontrado.</div>;

  const clearing = search || fAssignee || fPriority; // ¿Hay algún filtro activo?

  return (
    <div style={{ padding:'26px 30px', minHeight:'100vh' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        {/* Fila superior: info del proyecto + botones */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:30 }}>{project.icon}</span>
            <div>
              <h1 style={{ fontFamily:'var(--font-h)', fontSize:22, fontWeight:800, letterSpacing:'-0.4px' }}>{project.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                {/* Badge con la clave del proyecto */}
                <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--accent)', background:'rgba(124,111,255,.12)', padding:'2px 8px', borderRadius:4 }}>{project.key}</span>
                {project.description && <span style={{ fontSize:12, color:'var(--muted)' }}>{project.description}</span>}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Avatares de los miembros del proyecto (máximo 5) */}
            <div style={{ display:'flex' }}>
              {project.members?.slice(0,5).map((m,i) => (
                <div key={m.id} style={{ marginLeft: i>0 ? -8 : 0, border:'2px solid var(--bg)', borderRadius:'50%' }}>
                  <Avatar user={m} size={30}/>
                </div>
              ))}
            </div>

            {/* Botón principal: abre el modal con estado 'todo' por defecto */}
            <button
              onClick={() => { setCreateStatus('todo'); setShowCreate(true); }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#7c6fff,#a78bfa)', border:'none', borderRadius:'var(--r-sm)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}
            >
              <Plus size={14}/> Nueva tarea
            </button>
          </div>
        </div>

        {/* Fila de filtros */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {/* Campo de búsqueda por texto */}
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tareas..."
              style={{ paddingLeft:30, padding:'7px 12px 7px 30px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', color:'var(--text)', fontSize:13, outline:'none', width:190 }}
            />
          </div>

          {/* Selector de asignado */}
          <select value={fAssignee} onChange={e => setFAssignee(e.target.value)}
            style={{ padding:'7px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', color:'var(--muted)', fontSize:13, outline:'none', cursor:'pointer' }}>
            <option value="">Todos</option>
            <option value="none">Sin asignar</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          {/* Selector de prioridad */}
          <select value={fPriority} onChange={e => setFPriority(e.target.value)}
            style={{ padding:'7px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', color:'var(--muted)', fontSize:13, outline:'none', cursor:'pointer' }}>
            <option value="">Todas las prioridades</option>
            <option value="critical">🔴 Crítica</option>
            <option value="high">🟠 Alta</option>
            <option value="medium">🟡 Media</option>
            <option value="low">🟢 Baja</option>
          </select>

          {/* Botón para limpiar todos los filtros */}
          {clearing && (
            <button
              onClick={() => { setSearch(''); setFAssignee(''); setFPriority(''); }}
              style={{ padding:'7px 12px', background:'rgba(248,113,113,.1)', border:'none', borderRadius:'var(--r-sm)', color:'#f87171', fontSize:12, cursor:'pointer' }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── TABLERO KANBAN ─────────────────────────────────── */}
      {/* 4 columnas en grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {COLS.map(c => {
          const colTasks = col(c.id); // Tareas de esta columna (ya filtradas)

          return (
            <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

              {/* Cabecera de la columna */}
              <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:c.color, fontWeight:700 }}>{c.dot}</span>
                  <span style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:13 }}>{c.label}</span>
                  {/* Contador de tareas en la columna */}
                  <span style={{ background:'var(--surface2)', borderRadius:10, padding:'1px 7px', fontSize:10, fontFamily:'var(--font-m)', color:'var(--muted)' }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Botón "+" para crear tarea directamente en esta columna */}
                <button
                  onClick={() => { setCreateStatus(c.id); setShowCreate(true); }}
                  style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:4, borderRadius:5, transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--muted)'; }}
                >
                  <Plus size={14}/>
                </button>
              </div>

              {/* Lista de tarjetas de la columna */}
              <div style={{ flex:1, overflowY:'auto', padding:'8px 8px' }}>
                {colTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onClick={() => setSelected(t)} // Al hacer clic, abrimos el modal de detalle
                  />
                ))}

                {/* Mensaje cuando la columna está vacía */}
                {colTasks.length === 0 && (
                  <div style={{ padding:'24px 0', textAlign:'center', color:'var(--muted)', fontSize:12 }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>—</div>
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODALES ────────────────────────────────────────── */}
      {/* Modal de crear tarea (solo si showCreate es true) */}
      {showCreate && (
        <CreateTaskModal
          projectId={id}
          defaultStatus={createStatus}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Modal de detalle/edición (solo si hay una tarea seleccionada) */}
      {selected && (
        <TaskModal
          task={selected}
          users={users}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdated}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
