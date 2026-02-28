import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { inp, btnPrimary } from '../components/ui';

export default function LoginPage() {
  const [form, setForm]     = useState({ email:'', password:'' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
      toast.success('¡Bienvenido!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }} className="anim">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:50, height:50, borderRadius:14, margin:'0 auto 14px', background:'linear-gradient(135deg,#7c6fff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(124,111,255,.3)' }}>
            <Zap size={24} color="#fff" fill="#fff"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-h)', fontSize:30, fontWeight:800, letterSpacing:'-1px', marginBottom:6 }}>TaskFlow</h1>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Inicia sesión en tu espacio de trabajo</p>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:30 }}>
          <form onSubmit={submit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.6 }}>Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="tu@email.com" style={inp}/>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.6 }}>Contraseña</label>
              <div style={{ position:'relative' }}>
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="••••••••" style={{ ...inp, paddingRight:40 }}/>
                <button type="button" onClick={() => setShow(!show)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer' }}>
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ ...btnPrimary(loading), width:'100%', justifyContent:'center', padding:'11px' }}>
              {loading ? <><span className="spin" style={{ width:15, height:15, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%' }}/> Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <p style={{ marginTop:18, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
            ¿No tienes cuenta?{' '}<Link to="/register" style={{ color:'var(--accent2)', fontWeight:600 }}>Regístrate</Link>
          </p>

          {/* Demo box */}
          <div style={{ marginTop:18, padding:'12px 14px', background:'var(--surface2)', borderRadius:'var(--r-sm)', fontSize:12, fontFamily:'var(--font-m)', color:'var(--muted)', lineHeight:1.9 }}>
            <div style={{ fontWeight:600, color:'var(--text)', marginBottom:2 }}>Cuentas demo:</div>
            <div>admin@taskflow.com · Admin1234!</div>
            <div>dev@taskflow.com · Dev12345!</div>
            <div>design@taskflow.com · Design123!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
