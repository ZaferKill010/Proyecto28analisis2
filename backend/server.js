
const express = require('express');
const cors    = require('cors');


const app = express();


app.use(cors({ origin: 'http://localhost:5173', credentials: true }));


app.use(express.json());


app.use('/api/auth',     require('./routes/auth'));     // Login, Register, Me
app.use('/api/users',    require('./routes/users'));    // Listar y editar usuarios
app.use('/api/projects', require('./routes/projects')); // CRUD de proyectos
app.use('/api/tasks',    require('./routes/tasks'));    // CRUD de tareas + comentarios

app.get('/api/health', (_, res) => res.json({ ok: true, message: '🚀 TaskFlow API running' }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.path} no encontrada.` });
});

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

// ── Iniciar el servidor ───────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n⚡ TaskFlow API  →  http://localhost:${PORT}`);
  console.log(`\n📋 Credenciales demo:`);
  console.log(`   admin@taskflow.com  /  Admin1234!`);
  console.log(`   dev@taskflow.com    /  Dev12345!`);
  console.log(`   design@taskflow.com /  Design123!\n`);
});
