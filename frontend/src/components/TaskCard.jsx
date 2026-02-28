// ============================================================
//  components/TaskCard.jsx — Tarjeta visual de una tarea
// ============================================================
//  Cada tarjeta que ves en el tablero Kanban es este componente.
//  Muestra los datos más importantes de una tarea de forma compacta:
//    - Tipo e ícono
//    - Prioridad con color
//    - Título
//    - Tags
//    - Avatar del asignado
//    - Story points
//    - Número de comentarios
// ============================================================

import { MessageCircle } from 'lucide-react';
import { Avatar, priorityColor, typeIcon } from './ui';

// Etiquetas legibles para las prioridades
const PL = { low:'Baja', medium:'Media', high:'Alta', critical:'Crítica' };

export default function TaskCard({ task, onClick }) {
  // Obtenemos el color hex de la prioridad para el borde y la etiqueta
  const pc = priorityColor(task.priority);

  return (
    <div
      onClick={onClick}  // Al hacer clic en la tarjeta se abre el modal de detalle
      className="anim"   // Animación fadeUp al aparecer (definida en index.css)
      style={{
        background:'var(--surface2)',
        border:`1px solid var(--border)`,
        // El borde IZQUIERDO tiene el color de la prioridad (como en Jira)
        borderLeft:`3px solid ${pc}`,
        borderRadius:9,
        padding:'11px 13px',
        marginBottom:8,
        cursor:'pointer',
        transition:'all .15s',
      }}
      // Efectos hover: elevamos ligeramente la tarjeta y cambiamos el borde
      onMouseEnter={e => {
        e.currentTarget.style.transform  = 'translateY(-1px)';
        e.currentTarget.style.boxShadow  = 'var(--shadow)';
        e.currentTarget.style.borderColor = 'var(--border2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = '';
        e.currentTarget.style.boxShadow  = '';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* ── Fila 1: Tipo + Prioridad ─────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
        {/* Ícono del tipo (📖 story, 🐛 bug, ✅ task, ⚡ epic) */}
        <span style={{ fontSize:11 }}>{typeIcon(task.type)}</span>
        <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--muted)', textTransform:'uppercase', letterSpacing:1 }}>
          {task.type}
        </span>

        {/* Etiqueta de prioridad en la esquina derecha */}
        <span style={{
          marginLeft:'auto', fontSize:10, color:pc,
          background:`${pc}18`,  // Color con baja opacidad como fondo
          padding:'1px 7px', borderRadius:10, fontWeight:600,
        }}>
          {PL[task.priority]}
        </span>
      </div>

      {/* ── Fila 2: Título ───────────────────────────────── */}
      <p style={{ fontSize:13, fontWeight:600, lineHeight:1.4, marginBottom:9 }}>
        {task.title}
      </p>

      {/* ── Fila 3: Tags ─────────────────────────────────── */}
      {/* Solo mostramos los primeros 3 tags para no saturar la tarjeta */}
      {task.tags?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
          {task.tags.slice(0,3).map(t => (
            <span key={t} style={{ fontSize:10, padding:'2px 6px', background:'var(--surface3)', borderRadius:4, color:'var(--muted)', fontFamily:'var(--font-m)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* ── Fila 4: Footer (asignado, puntos, comentarios) ── */}
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        {/* Avatar del usuario asignado */}
        <Avatar user={task.assignee} size={22}/>

        {/* Si no hay asignado, mostramos un círculo de "?" */}
        {!task.assignee?.id && (
          <div title="Sin asignar" style={{ width:22, height:22, borderRadius:'50%', border:'1px dashed var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--muted)' }}>?</div>
        )}

        {/* Story points (solo si tiene puntos asignados) */}
        {task.storyPoints > 0 && (
          <span style={{ fontSize:10, background:'var(--surface3)', borderRadius:5, padding:'2px 6px', color:'var(--muted)', fontFamily:'var(--font-m)' }}>
            {task.storyPoints}p
          </span>
        )}

        {/* Contador de comentarios (solo si hay comentarios) */}
        {task.comments?.length > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--muted)', marginLeft:'auto' }}>
            <MessageCircle size={10}/> {task.comments.length}
          </span>
        )}
      </div>
    </div>
  );
}
