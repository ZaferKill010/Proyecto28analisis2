import { useState } from 'react';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Modal, Field, inp, btnPrimary, btnSecondary } from './ui';

const ICONS   = ['📋','🚀','💡','🎯','⚡','🛠️','🎨','🔥','🌟','💎','🦄','📱'];
const COLORS  = ['#7c6fff','#ec4899','#f59e0b','#10b981','#3b82f6','#f87171','#8b5cf6','#06b6d4'];

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', key:'', description:'', icon:'📋', color:'#7c6fff' });
  const [loading, setLoading] = useState(false);

  const onName = name => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
    setForm({ ...form, name, key });
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await projectsAPI.create(form);
      onCreated(r.data.project);
      toast.success('Proyecto creado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Nuevo Proyecto" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Ícono">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setForm({...form, icon:ic})}
                style={{ width:38, height:38, fontSize:18, borderRadius:8, border:`2px solid ${form.icon===ic ? 'var(--accent)':'var(--border)'}`, background: form.icon===ic ? 'rgba(124,111,255,.15)':'var(--surface2)', cursor:'pointer' }}>
                {ic}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Color">
          <div style={{ display:'flex', gap:8 }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm({...form, color:c})}
                style={{ width:26, height:26, borderRadius:'50%', background:c, border:'none', cursor:'pointer', outline: form.color===c ? `3px solid ${c}` : 'none', outlineOffset:2, transition:'all .15s' }}/>
            ))}
          </div>
        </Field>

        <Field label="Nombre *">
          <input required value={form.name} onChange={e => onName(e.target.value)} placeholder="Mi proyecto" style={inp}/>
        </Field>

        <Field label="Clave *">
          <input required value={form.key} maxLength={10}
            onChange={e => setForm({...form, key:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10)})}
            placeholder="PROJ" style={{ ...inp, fontFamily:'var(--font-m)', letterSpacing:2 }}/>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Solo mayúsculas y números. Ej: TFA, BKD</div>
        </Field>

        <Field label="Descripción">
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="¿De qué trata?" style={{ ...inp, resize:'vertical' }}/>
        </Field>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} style={btnPrimary(loading)}>{loading ? 'Creando...' : 'Crear proyecto'}</button>
        </div>
      </form>
    </Modal>
  );
}
