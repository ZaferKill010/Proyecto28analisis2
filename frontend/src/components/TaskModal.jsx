// ============================================================
//  components/TaskModal.jsx — Modal de detalle y edición
// ============================================================
//  Se abre al hacer clic en una TaskCard.
//  Tiene dos "modos":
//    - Vista: muestra todos los datos de la tarea
//    - Edición: formulario para modificar los datos
//
//  También incluye:
//    - Sección de comentarios con su formulario
//    - Historial de cambios automático
//    - Selector de estado rápido (sin entrar en modo edición)
// ============================================================

import { useState } from 'react';
import { Trash2, Edit3, Save } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Modal, Field, Sel, inp, btnPrimary, btnSecondary, btnDanger, Avatar, priorityColor, typeIcon } from './ui';

// Datos de referencia para los selectores y visualización
const ST = { todo:'Por hacer', in_progress:'En progreso', in_review:'En revisión', done:'Listo' };
const SC = { todo:'#8080a8', in_progress:'#fbbf24', in_review:'#60a5fa', done:'#34d399' };
const PL = { low:'Baja', medium:'Media', high:'Alta', critical:'Crítica' };

export default function TaskModal({ task, users, onClose, onUpdate, onDelete }) {
  const { user } = useAuth(); // Usuario logueado para los comentarios

  // Estado del modo de edición (false = vista, true = formulario)
  const [editing, setEditing] = useState(false);

  // Estado del formulario de edición.
  // Se inicializa con los valores actuales de la tarea.
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || '',
    status:      task.status,
    priority:    task.priority,
    type:        task.type,
    assigneeId:  task.assignee?.id || '',
    storyPoints: task.storyPoints || 0,
    // La fecha la formateamos a "YYYY-MM-DD" para el input type="date"
    dueDate:     task.dueDate ? task.dueDate.slice(0,10) : '',
    // Los tags los unimos con ", " para mostrarlos como texto editable
    tags:        task.tags?.join(', ') || '',
  });

  const [comment,    setComment]    = useState('');   // Texto del nuevo comentario
  const [saving,     setSaving]     = useState(false); // Loading del botón guardar
  const [commenting, setCommenting] = useState(false); // Loading del botón comentar

  // ── Guardar cambios de edición ──────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const r = await tasksAPI.update(task.id, {
        ...form,
        assigneeId:  form.assigneeId || null, // String vacío → null
        storyPoints: parseInt(form.storyPoints) || 0,
        dueDate:     form.dueDate || null,
        // Convertimos el string de tags a array
        // "frontend, bug, api" → ["frontend", "bug", "api"]
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      });
      onUpdate(r.data.task);   // Notificamos al padre para que actualice su estado
      setEditing(false);       // Volvemos al modo vista
      toast.success('Actualizado');
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  // ── Cambio rápido de estado ─────────────────────────────────
  // No requiere modo edición, se cambia directo desde el selector del panel
  const quickStatus = async (status) => {
    try {
      const r = await tasksAPI.updateStatus(task.id, status);
      onUpdate(r.data.task);
    } catch { toast.error('Error'); }
  };

  // ── Enviar comentario ───────────────────────────────────────
  // Enter también envía (manejado en el onKeyDown del input)
  const sendComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const r = await tasksAPI.addComment(task.id, comment);
      // Actualizamos la tarea con los nuevos comentarios
      onUpdate({ ...task, comments: r.data.comments });
      setComment(''); // Limpiamos el campo
    } catch { toast.error('Error'); }
    finally { setCommenting(false); }
  };

  const pc = priorityColor(task.priority); // Color de la prioridad actual

  return (
    // wide=true para que el modal sea más ancho (2 columnas adentro)
    <Modal title={`${typeIcon(task.type)} ${task.type.toUpperCase()} — Detalle`} onClose={onClose} wide>
      {/* Layout de 2 columnas: contenido principal + panel de detalles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 268px', gap:26 }}>

        {/* ── COLUMNA IZQUIERDA: Título, descripción, comentarios, historial ── */}
        <div>
          {/* ── Modo edición ── */}
          {editing ? (
            <>
              {/* Input del título en modo edición */}
              <input
                value={form.title}
                onChange={e => setForm({...form, title:e.target.value})}
                style={{ ...inp, fontSize:18, fontFamily:'var(--font-h)', fontWeight:700, marginBottom:12 }}
              />
              {/* Textarea de descripción */}
              <textarea
                rows={5} value={form.description}
                onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Descripción..." style={{ ...inp, resize:'vertical', marginBottom:14 }}
              />
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <button onClick={save} disabled={saving} style={btnPrimary(saving)}>
                  <Save size={13}/> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(false)} style={btnSecondary}>Cancelar</button>
              </div>
            </>
          ) : (
            /* ── Modo vista ── */
            <>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <h2 style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:800, letterSpacing:'-0.3px', flex:1, lineHeight:1.3 }}>
                  {task.title}
                </h2>
                <button onClick={() => setEditing(true)} style={{ ...btnSecondary, display:'flex', alignItems:'center', gap:6, padding:'6px 12px', flexShrink:0, fontSize:12 }}>
                  <Edit3 size={12}/> Editar
                </button>
              </div>

              {/* Descripción o mensaje de "sin descripción" */}
              {task.description
                ? <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:18, whiteSpace:'pre-wrap' }}>{task.description}</p>
                : <p style={{ color:'var(--muted)', fontSize:13, marginBottom:18, opacity:.5, fontStyle:'italic' }}>Sin descripción.</p>
              }

              {/* Tags en modo vista */}
              {task.tags?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
                  {task.tags.map(t => (
                    <span key={t} style={{ fontSize:11, padding:'2px 8px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, color:'var(--muted)', fontFamily:'var(--font-m)' }}>#{t}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Sección de comentarios ── */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:18, marginTop:4 }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:13, marginBottom:14 }}>
              💬 Comentarios ({task.comments?.length||0})
            </h3>

            {/* Lista de comentarios existentes */}
            {task.comments?.map((c,i) => (
              <div key={i} style={{ display:'flex', gap:9, marginBottom:14 }}>
                <Avatar user={c.user} size={28}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{c.user?.name||'Usuario'}</span>
                    <span style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-m)' }}>
                      {/* Formateamos la fecha a "15 ene" */}
                      {new Date(c.createdAt).toLocaleDateString('es',{ day:'numeric', month:'short' })}
                    </span>
                  </div>
                  <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}

            {/* Formulario para agregar comentario */}
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <Avatar user={user} size={28}/>
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                // Enter envía el comentario (Shift+Enter para nueva línea)
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); }}}
                placeholder="Agregar comentario... (Enter para enviar)"
                style={{ ...inp, flex:1 }}
              />
              <button onClick={sendComment} disabled={commenting||!comment.trim()} style={btnPrimary(commenting||!comment.trim())}>
                Enviar
              </button>
            </div>
          </div>

          {/* ── Historial de cambios ── */}
          {task.history?.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:18, marginTop:18 }}>
              <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:13, marginBottom:10 }}>🕐 Historial</h3>
              {/* Mostramos los 8 más recientes, en orden inverso (más nuevo primero) */}
              {[...task.history].reverse().slice(0,8).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:7 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>
                  <span>
                    {/* Texto descriptivo según el tipo de acción */}
                    {h.action==='created'        ? 'Tarea creada'
                   : h.action==='status_changed' ? `Estado → ${ST[h.newValue]||h.newValue}`
                   :                               `Actualizó ${h.field}`}
                  </span>
                  <span style={{ marginLeft:'auto', fontFamily:'var(--font-m)', fontSize:10 }}>
                    {new Date(h.createdAt).toLocaleDateString('es', { day:'numeric', month:'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Panel de metadatos ── */}
        <div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:16 }}>
            <div style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:14 }}>
              Detalles
            </div>

            {/* Estado: selector directo (sin modo edición) */}
            <Detail label="Estado">
              <select
                value={task.status}
                onChange={e => quickStatus(e.target.value)}
                style={{ padding:'5px 10px', background:'var(--surface)', border:`1px solid ${SC[task.status]}44`, borderRadius:'var(--r-sm)', color: SC[task.status], fontSize:12, outline:'none', cursor:'pointer', width:'100%', fontWeight:600 }}
              >
                {Object.entries(ST).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Detail>

            {/* Prioridad: en edición es selector, en vista es texto coloreado */}
            <Detail label="Prioridad">
              {editing
                ? <Sel value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
                    <option value="low">🟢 Baja</option><option value="medium">🟡 Media</option>
                    <option value="high">🟠 Alta</option><option value="critical">🔴 Crítica</option>
                  </Sel>
                : <span style={{ color:pc, fontWeight:600, fontSize:13 }}>{PL[task.priority]}</span>
              }
            </Detail>

            {/* Asignado */}
            <Detail label="Asignado">
              {editing
                ? <Sel value={form.assigneeId} onChange={e => setForm({...form,assigneeId:e.target.value})}>
                    <option value="">Sin asignar</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Sel>
                : task.assignee?.id
                  ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar user={task.assignee} size={22}/>
                      <span style={{ fontSize:13 }}>{task.assignee.name}</span>
                    </div>
                  : <span style={{ color:'var(--muted)', fontSize:13 }}>Sin asignar</span>
              }
            </Detail>

            {/* Story Points */}
            <Detail label="Story Points">
              {editing
                ? <input type="number" min="0" max="100" value={form.storyPoints} onChange={e => setForm({...form,storyPoints:e.target.value})} style={{ ...inp, fontSize:12 }}/>
                : <span style={{ fontSize:13, fontFamily:'var(--font-m)' }}>{task.storyPoints||0} pts</span>
              }
            </Detail>

            <Detail label="Tipo">
              <span style={{ fontSize:13 }}>{typeIcon(task.type)} {task.type}</span>
            </Detail>

            <Detail label="Creado">
              <span style={{ fontSize:12, color:'var(--muted)', fontFamily:'var(--font-m)' }}>
                {new Date(task.createdAt).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})}
              </span>
            </Detail>

            {/* Botón de eliminar */}
            <button
              onClick={() => onDelete(task.id)}
              style={{ ...btnDanger, width:'100%', justifyContent:'center', marginTop:16 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(248,113,113,.08)'}
            >
              <Trash2 size={12}/> Eliminar tarea
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ── Detail: fila de metadato en el panel derecho ──────────────
function Detail({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
