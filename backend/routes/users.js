// ============================================================
//  routes/users.js — Gestión de usuarios
// ============================================================
//  Endpoints:
//    GET /api/users     → Listar todos los usuarios (para asignar tareas)
//    PUT /api/users/me  → Actualizar el perfil propio
//
//  Todas las rutas requieren autenticación (middleware "protect")
// ============================================================

const router = require('express').Router();
const { db, sanitizeUser } = require('../data/store');
const { protect } = require('../middleware/auth');

// ── GET /api/users ────────────────────────────────────────────
// Devuelve todos los usuarios disponibles.
// Se usa en el frontend para el selector "Asignar a" al crear/editar tareas.
router.get('/', protect, (req, res) => {
  // Mapeamos cada usuario con sanitizeUser para eliminar las contraseñas
  res.json({ success: true, users: db.users.map(sanitizeUser) });
});

// ── PUT /api/users/me ─────────────────────────────────────────
// Permite al usuario logueado actualizar su propio perfil.
// Solo puede cambiar nombre, rol y color (no email ni password aquí).
router.put('/me', protect, (req, res) => {
  // Buscamos el índice del usuario en el arreglo para poder modificarlo
  // findIndex devuelve la posición (0, 1, 2...) o -1 si no existe
  const idx = db.users.findIndex(u => u.id === req.user.id);

  if (idx === -1)
    return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

  // Extraemos solo los campos que permitimos cambiar
  const { name, role, color } = req.body;

  // Actualizamos solo si el campo viene en la request
  // Así evitamos borrar datos si no se manda un campo
  if (name)  db.users[idx].name  = name;
  if (role)  db.users[idx].role  = role;
  if (color) db.users[idx].color = color;

  res.json({ success: true, user: sanitizeUser(db.users[idx]) });
});

module.exports = router;
