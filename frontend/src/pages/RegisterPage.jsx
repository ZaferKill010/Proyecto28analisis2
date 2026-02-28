import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { inp, btnPrimary } from '../components/ui';

const ROLES = ['developer','designer','tester','manager','admin'];

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'developer' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
      toast.success('¡Cuenta creada!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }} className="anim">
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{ width:50, height:50, borderRadius:14, margin:'0 auto 14px', background:'linear-gradient(135deg,#7c6fff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(124,111,255,.3)' }}>
            <Zap size={24} color="#fff" fill="#fff"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-h)', fontSize:26, fontWeight:800, letterSpacing:'-0.5px', marginBottom:5 }}>Crear cuenta</h1>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Únete a tu equipo en TaskFlow</p>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:30 }}>
          <form onSubmit={submit}>
            {[
              { k:'name', label:'Nombre', type:'text', ph:'Juan Pérez' },
              { k:'email', label:'Email', type:'email', ph:'tu@email.com' },
              { k:'password', label:'Contraseña (mín. 8)', type:'password', ph:'••••••••' },
            ].map(({ k, label, type, ph }) => (
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:5, fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.6 }}>{label}</label>
                <input type={type} required value={form[k]} placeholder={ph} onChange={e => setForm({...form, [k]:e.target.value})} style={inp}/>
              </div>
            ))}
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.6 }}>Rol</label>
              <select value={form.role} onChange={e => setForm({...form, role:e.target.value})} style={{ ...inp, cursor:'pointer' }}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ ...btnPrimary(loading), width:'100%', justifyContent:'center', padding:'11px' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
          <p style={{ marginTop:16, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color:'var(--accent2)', fontWeight:600 }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
