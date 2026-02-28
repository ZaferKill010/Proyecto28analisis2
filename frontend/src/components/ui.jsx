// ============================================================
//  components/ui.jsx — Componentes y estilos compartidos
// ============================================================
//  En vez de repetir los mismos estilos inline en cada archivo,
//  centralizamos aquí los elementos más usados:
//    - Estilos de inputs, botones
//    - Componentes: Field, Sel, Modal, Avatar, StatusPill
//    - Funciones helper de colores y etiquetas
//
//  Todos los componentes de esta app importan desde aquí.
// ============================================================

import { X } from 'lucide-react';

// ── Estilos base (objetos de style inline) ────────────────────
// Los exportamos como constantes para no repetir código

// Estilo base de los campos de texto, fecha, number
export const inp = {
  width:'100%', padding:'9px 12px',
  background:'var(--surface2)',      // Variable CSS definida en index.css
  border:'1px solid var(--border)',
  borderRadius:'var(--r-sm)',
  color:'var(--text)',
  fontSize:13,
  outline:'none',                    // Quitamos el outline azul del navegador
};

// Botón primario (morado degradado) — acepta boolean "disabled" para cambiar apariencia
export const btnPrimary = (disabled) => ({
  padding:'9px 20px',
  background: disabled
    ? 'var(--surface3)'                              // Gris cuando está deshabilitado
    : 'linear-gradient(135deg,#7c6fff,#a78bfa)',     // Morado cuando está activo
  border:'none', borderRadius:'var(--r-sm)',
  color:'#fff', fontWeight:700, fontSize:13,
  cursor: disabled ? 'not-allowed' : 'pointer',     // Cursor diferente si está disabled
  fontFamily:'var(--font-h)',
  transition:'opacity .15s',
  display:'flex', alignItems:'center', gap:6,        // Para íconos junto al texto
});

// Botón secundario (borde sutil, fondo oscuro)
export const btnSecondary = {
  padding:'9px 20px',
  background:'var(--surface2)',
  border:'1px solid var(--border)',
  borderRadius:'var(--r-sm)',
  color:'var(--text)', fontWeight:500, fontSize:13, cursor:'pointer',
};

// Botón de peligro (rojo, para eliminar)
export const btnDanger = {
  padding:'8px 14px',
  background:'rgba(248,113,113,.08)',
  border:'1px solid rgba(248,113,113,.2)',
  borderRadius:'var(--r-sm)', color:'#f87171',
  fontWeight:500, fontSize:12, cursor:'pointer',
  display:'flex', alignItems:'center', gap:6,
  transition:'background .15s',
};

// ── Field: etiqueta + campo de formulario ─────────────────────
// Agrupa el label y el input con espaciado consistente.
// Uso: <Field label="Título"><input .../></Field>
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{
        display:'block', marginBottom:5,
        fontSize:11, fontWeight:600, color:'var(--muted)',
        textTransform:'uppercase', letterSpacing:.6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Sel: select estilizado ────────────────────────────────────
// Envuelve el <select> nativo con el estilo visual de la app.
// Uso: <Sel value={x} onChange={...}><option>...</option></Sel>
export function Sel({ children, ...props }) {
  return (
    <select
      {...props}  // Pasamos todos los props (value, onChange, etc.) al select nativo
      style={{
        width:'100%', padding:'9px 12px',
        background:'var(--surface2)', border:'1px solid var(--border)',
        borderRadius:'var(--r-sm)', color:'var(--text)',
        fontSize:13, outline:'none', cursor:'pointer',
      }}
    >
      {children}
    </select>
  );
}

// ── Modal: ventana emergente (overlay) ───────────────────────
// Renderiza un overlay oscuro con un contenedor centrado.
// Al hacer clic fuera del modal, llama a onClose().
// Uso: <Modal title="Crear tarea" onClose={() => setShow(false)}>...</Modal>
export function Modal({ title, onClose, children, wide }) {
  return (
    // Overlay: fondo oscuro semitransparente que cubre toda la pantalla
    <div
      style={{
        position:'fixed', inset:0,                    // Cubre todo
        background:'rgba(0,0,0,.75)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, padding:20,
        backdropFilter:'blur(6px)',                   // Desenfoca el fondo
      }}
      // onClick en el overlay (no en el contenido) → cierra el modal
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Contenedor del modal */}
      <div
        className="anim"  // Animación fadeUp definida en index.css
        style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-lg)', width:'100%',
          maxWidth: wide ? 860 : 540,   // wide=true para modales más anchos
          maxHeight:'90vh', overflowY:'auto',
          boxShadow:'var(--shadow-lg)',
        }}
      >
        {/* Cabecera del modal: título + botón de cerrar */}
        <div style={{
          padding:'18px 22px 14px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0,               // Se queda arriba al hacer scroll
          background:'var(--surface)', zIndex:1,
        }}>
          <span style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:17 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:4, borderRadius:6 }}>
            <X size={17}/>
          </button>
        </div>

        {/* Contenido del modal (lo que se pase entre las etiquetas) */}
        <div style={{ padding:'20px 22px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Avatar: círculo con las iniciales del usuario ────────────
// Muestra el color y las iniciales de un usuario.
// Si no hay usuario, no renderiza nada.
export function Avatar({ user, size = 28 }) {
  if (!user?.id) return null;
  return (
    <div
      title={user.name}  // Tooltip al hacer hover
      style={{
        width:size, height:size, borderRadius:'50%',
        background: user.color || 'var(--accent)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size * .38,    // El tamaño de la fuente escala con el avatar
        fontWeight:700, color:'#fff', flexShrink:0,
      }}
    >
      {/* Mostramos las iniciales del avatar guardadas (ej: "AU", "DO") */}
      {user.avatar || user.name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── StatusPill: etiqueta de estado coloreada ─────────────────
// Muestra el estado de una tarea como una pastilla de color.
const SC = { todo:'#8080a8', in_progress:'#fbbf24', in_review:'#60a5fa', done:'#34d399' };
const SL = { todo:'Por hacer', in_progress:'En progreso', in_review:'En revisión', done:'Listo' };

export function StatusPill({ status }) {
  return (
    <span style={{
      fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
      background:`${SC[status]}22`,  // Color con 22 de opacidad (hex) = ~13%
      color: SC[status],
      whiteSpace:'nowrap',
    }}>
      {SL[status]}
    </span>
  );
}

// ── priorityColor: devuelve el color hex según la prioridad ──
// Uso: style={{ color: priorityColor('critical') }}
const PC = { low:'#34d399', medium:'#fbbf24', high:'#fb923c', critical:'#f87171' };
export const priorityColor = (p) => PC[p] || '#888';

// ── typeIcon: devuelve el emoji según el tipo de tarea ────────
// Uso: <span>{typeIcon('bug')}</span> → 🐛
const TI = { story:'📖', bug:'🐛', task:'✅', epic:'⚡' };
export const typeIcon = (t) => TI[t] || '✅';
