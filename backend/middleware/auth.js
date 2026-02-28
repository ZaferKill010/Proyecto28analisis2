// ============================================================
//  middleware/auth.js — Autenticación con JWT
// ============================================================
//  Un "middleware" en Express es una función que se ejecuta
//  ANTES de llegar al handler final de la ruta.
//
//  Flujo:  Request → [protect] → [handler de la ruta] → Response
//
//  JWT (JSON Web Token) es un string codificado en Base64 que
//  contiene datos del usuario y una firma criptográfica.
//  Ejemplo de token:
//    eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InVzZXItMSJ9.xxxxx
//    └──── header ──────┘ └──── payload ────────┘ └─ firma ─┘
// ============================================================

const jwt = require('jsonwebtoken');
const { db, sanitizeUser } = require('../data/store');

// Esta clave secreta se usa para FIRMAR y VERIFICAR los tokens.
// En producción debería estar en una variable de entorno (.env)
// y ser una cadena larga y aleatoria.
const JWT_SECRET = 'taskflow_secret_2024';

// ── Middleware "protect" ──────────────────────────────────────
// Protege rutas que requieren estar autenticado.
// Si el token es válido, adjunta req.user con los datos del usuario.
// Si no, responde con error 401 (No autorizado).
const protect = (req, res, next) => {
  // Los tokens se envían en el header "Authorization" con formato:
  // "Bearer eyJhbGciOiJIUzI1NiJ9..."
  const auth = req.headers.authorization;

  // Verificamos que existe el header y empieza con "Bearer "
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido.' });
  }

  try {
    // Separamos "Bearer eyJ..." → tomamos solo el token (índice 1)
    const token = auth.split(' ')[1];

    // jwt.verify lanza un error si el token es inválido o expiró.
    // Si es válido, retorna el payload: { id: 'user-1', iat: ..., exp: ... }
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscamos el usuario en memoria por el ID que está dentro del token
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    // Adjuntamos el usuario (sin password) a req para que las rutas lo usen
    // Ejemplo de uso en una ruta: const userId = req.user.id
    req.user = sanitizeUser(user);

    // Llamamos next() para continuar al handler de la ruta
    next();

  } catch {
    // jwt.verify lanzó error: token inválido, malformado o expirado
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

// ── signToken: crea un nuevo JWT ──────────────────────────────
// Se llama después del login/registro para darle el token al usuario.
// El token expira en 7 días ('7d').
// Payload guardado: { id: userId }
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

module.exports = { protect, signToken };
