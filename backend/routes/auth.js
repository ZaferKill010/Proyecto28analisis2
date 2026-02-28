
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { v4: uuid } = require('uuid'); // Generador de IDs únicos
const { db, sanitizeUser } = require('../data/store');
const { protect, signToken } = require('../middleware/auth');

// ── POST /api/auth/register ───────────────────────────────────
// Crea un nuevo usuario y devuelve su token JWT.
router.post('/register', (req, res) => {
  // Extraemos los datos del body de la request
  const { name, email, password, role } = req.body;

  // Validaciones básicas antes de procesar
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });

  if (password.length < 8)
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });

  // Verificamos que el email no esté ya registrado
  // .toLowerCase() asegura que "User@Email.com" y "user@email.com" sean iguales
  if (db.users.find(u => u.email === email.toLowerCase()))
    return res.status(400).json({ success: false, message: 'El email ya está registrado.' });

  // Creamos el objeto usuario
  const user = {
    id: uuid(),                          // ID único: "f47ac10b-58cc-..."
    name: name.trim(),                    // .trim() quita espacios al inicio/fin
    email: email.toLowerCase().trim(),
    password: bcrypt.hashSync(password, 10), // Encriptamos la contraseña
    role: role || 'developer',            // Si no manda role, usamos 'developer'
    // Las iniciales del nombre para el avatar visual
    avatar: name.trim().slice(0, 2).toUpperCase(),
    // Color aleatorio del arreglo para el fondo del avatar
    color: ['#7c6fff','#ec4899','#f59e0b','#10b981','#3b82f6','#f472b6'][Math.floor(Math.random() * 6)],
    createdAt: new Date().toISOString(),
  };

  // Guardamos el usuario en el arreglo en memoria
  db.users.push(user);

  // Creamos el token JWT con el ID del usuario
  const token = signToken(user.id);

  // Respondemos con el token y el usuario (sin password)
  // Status 201 = "Created" (recurso creado exitosamente)
  res.status(201).json({ success: true, token, user: sanitizeUser(user) });
});

// ── POST /api/auth/login ──────────────────────────────────────
// Verifica credenciales y devuelve el token JWT.
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });

  // Buscamos el usuario por email (normalizando a minúsculas)
  const user = db.users.find(u => u.email === email.toLowerCase().trim());

  // bcrypt.compareSync compara el texto plano con el hash guardado.
  // Retorna true si coinciden, false si no.
  // Si el usuario no existe O la contraseña no coincide → error 401
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

  // Creamos el token y respondemos
  const token = signToken(user.id);
  res.json({ success: true, token, user: sanitizeUser(user) });
});

// ── GET /api/auth/me ──────────────────────────────────────────
// Ruta protegida: el middleware "protect" verifica el token primero.
// Si el token es válido, req.user ya contiene los datos del usuario.
// Útil para que el frontend verifique si la sesión sigue activa.
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
