import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI } from '../services/api';
import { CheckCircle2, Clock, AlertCircle, FolderKanban, ArrowRight } from 'lucide-react';
import { StatusPill, Avatar } from '../components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTasks,  setMyTasks]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([projectsAPI.getAll(), tasksAPI.getAll({ assigneeId:'me' })])
      .then(([pr, tr]) => { setProjects(pr.data.projects); setMyTasks(tr.data.tasks); })
      .finally(() => setLoading(false));
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';

  const done  = myTasks.filter(t => t.status === 'done').length;
  const wip   = myTasks.filter(t => t.status === 'in_progress').length;
  const crit  = myTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;

  if (loading) return <Skeleton />;

  return (
    <div style={{ padding:'30px 36px', maxWidth:1080 }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-h)', fontSize:28, fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--muted)', fontSize:14 }}>Resumen de tu actividad hoy.</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
        {[
          { label:'Mis tareas',    value:myTasks.length, icon:<FolderKanban size={19}/>, color:'#7c6fff', bg:'rgba(124,111,255,.1)' },
          { label:'En progreso',   value:wip,            icon:<Clock size={19}/>,        color:'#fbbf24', bg:'rgba(251,191,36,.1)' },
          { label:'Completadas',   value:done,           icon:<CheckCircle2 size={19}/>, color:'#34d399', bg:'rgba(52,211,153,.1)' },
          { label:'Críticas',      value:crit,           icon:<AlertCircle size={19}/>,  color:'#f87171', bg:'rgba(248,113,113,.1)' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--font-h)' }}>{value}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
        {/* Projects */}
        <div>
          <SectionTitle>Proyectos activos</SectionTitle>
          {projects.filter(p => p.status === 'active').map(p => {
            const total = Object.values(p.stats || {}).reduce((a,b) => a+b, 0);
            const pct   = total ? Math.round((p.stats.done / total) * 100) : 0;
            return (
              <Link key={p.id} to={`/project/${p.id}`}>
                <div className="card-hover" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:10, cursor:'pointer', transition:'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div>
                        <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-m)' }}>{p.key} · {total} tareas</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--muted)"/>
                  </div>
                  <div style={{ height:3, background:'var(--surface2)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#7c6fff,#34d399)', borderRadius:2, transition:'width .6s' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:5, textAlign:'right' }}>{pct}% completado</div>
                </div>
              </Link>
            );
          })}
          {projects.filter(p => p.status === 'active').length === 0 && <Empty text="Sin proyectos activos"/>}
        </div>

        {/* My tasks */}
        <div>
          <SectionTitle>Mis tareas pendientes</SectionTitle>
          {myTasks.filter(t => t.status !== 'done').slice(0, 8).map(t => (
            <div key={t.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: t.priority === 'critical' ? '#f87171' : t.priority === 'high' ? '#fb923c' : t.priority === 'medium' ? '#fbbf24' : '#34d399' }}/>
              <span style={{ flex:1, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
              <StatusPill status={t.status}/>
            </div>
          ))}
          {myTasks.filter(t => t.status !== 'done').length === 0 && <Empty text="¡Sin tareas pendientes! 🎉"/>}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700, marginBottom:14, color:'var(--text)' }}>{children}</h2>;
}
function Empty({ text }) {
  return <div style={{ padding:28, textAlign:'center', color:'var(--muted)', background:'var(--surface)', border:'1px dashed var(--border)', borderRadius:'var(--r)', fontSize:13 }}>{text}</div>;
}
function Skeleton() {
  return (
    <div style={{ padding:'30px 36px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height:60, background:'var(--surface)', borderRadius:'var(--r)', marginBottom:14, animation:'pulse 1.5s ease infinite' }}/>)}
    </div>
  );
}
