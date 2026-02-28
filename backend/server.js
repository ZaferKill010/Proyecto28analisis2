// ============================================================
//  server.js — Punto de entrada del backend
// ============================================================
//  Este archivo:
//    1. Crea la aplicación Express
//    2. Configura los middlewares globales (cors, json)
//    3. Registra todas las rutas de la API
//    4. Arranca el servidor en el puerto 5000
// ============================================================

const express = require('express');
const cors    = require('cors');

// Creamos la aplicación Express
// "app" es el objeto central que maneja todas las requests HTTP
const app = express();

// ── Middlewares globales ──────────────────────────────────────
// Estos se ejecutan en TODAS las requests, antes de llegar a las rutas.

// cors() permite que el frontend en localhost:5173 pueda hacer
// peticiones a este servidor en localhost:5000.
// Sin esto, el navegador bloquearía las peticiones por seguridad
// (política "same-origin").
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// express.json() parsea el body de las requests con Content-Type: application/json
// Sin esto, req.body sería undefined en POST/PUT
app.use(express.json());

// ── Registro de rutas ─────────────────────────────────────────
// Cada archivo de rutas maneja un grupo de endpoints relacionados.
// El primer argumento es el prefijo de URL.
// Ejemplo: POST /api/auth/login → llama al handler en routes/auth.js

app.use('/api/auth',     require('./routes/auth'));     // Login, Register, Me
app.use('/api/users',    require('./routes/users'));    // Listar y editar usuarios
app.use('/api/projects', require('./routes/projects')); // CRUD de proyectos
app.use('/api/tasks',    require('./routes/tasks'));    // CRUD de tareas + comentarios

// ── Ruta de salud (health check) ─────────────────────────────
// Útil para verificar rápido si el servidor está corriendo.
// Pruébala en: GET http://localhost:5000/api/health
app.get('/api/health', (_, res) => res.json({ ok: true, message: '🚀 TaskFlow API running' }));

// ── Manejador de rutas no encontradas (404) ───────────────────
// Si ninguna ruta coincide, respondemos con 404.
// Nota: debe ir DESPUÉS de todas las rutas registradas.
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.path} no encontrada.` });
});

// ── Manejador de errores global ───────────────────────────────
// Captura cualquier error que llegue con next(error) desde las rutas.
// Los 4 parámetros (err, req, res, next) identifican a Express
// que es un error handler especial.
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
