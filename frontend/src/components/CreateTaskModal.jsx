import { useState } from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Modal, Field, Sel, inp, btnPrimary, btnSecondary } from './ui';

export default function CreateTaskModal({ projectId, defaultStatus, users, onClose, onCreated }) {
  const [form, setForm] = useState({
    title:'', description:'', status: defaultStatus || 'todo',
    priority:'medium', type:'task', assigneeId:'',
    storyPoints:0, dueDate:'', tags:'',
  });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await tasksAPI.create({ ...form, projectId, assigneeId: form.assigneeId || null, storyPoints: parseInt(form.storyPoints)||0, dueDate: form.dueDate || null });
      onCreated(r.data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando tarea');
    } finally { setLoading(false); }
  };

  const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 };

  return (
    <Modal title="Nueva Tarea" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Título *">
          <input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Título de la tarea..." style={inp}/>
        </Field>
        <Field label="Descripción">
          <textarea rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Descripción..." style={{ ...inp, resize:'vertical' }}/>
        </Field>

        <div style={g2}>
          <Field label="Estado">
            <Sel value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="in_review">En revisión</option>
              <option value="done">Listo</option>
            </Sel>
          </Field>
          <Field label="Prioridad">
            <Sel value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
              <option value="low">🟢 Baja</option>
              <option value="medium">🟡 Media</option>
              <option value="high">🟠 Alta</option>
              <option value="critical">🔴 Crítica</option>
            </Sel>
          </Field>
          <Field label="Tipo">
            <Sel value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
              <option value="task">✅ Tarea</option>
              <option value="story">📖 Historia</option>
              <option value="bug">🐛 Bug</option>
              <option value="epic">⚡ Épica</option>
            </Sel>
          </Field>
          <Field label="Asignar a">
            <Sel value={form.assigneeId} onChange={e => setForm({...form,assigneeId:e.target.value})}>
              <option value="">Sin asignar</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Sel>
          </Field>
          <Field label="Story Points">
            <input type="number" min="0" max="100" value={form.storyPoints} onChange={e => setForm({...form,storyPoints:e.target.value})} style={inp}/>
          </Field>
          <Field label="Fecha límite">
            <input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})} style={inp}/>
          </Field>
        </div>

        <Field label="Tags (separados por coma)">
          <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="frontend, bug, api" style={inp}/>
        </Field>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} style={btnPrimary(loading)}>{loading ? 'Creando...' : 'Crear tarea'}</button>
        </div>
      </form>
    </Modal>
  );
}
