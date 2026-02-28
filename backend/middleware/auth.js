

const jwt = require('jsonwebtoken');
const { db, sanitizeUser } = require('../data/store');

const JWT_SECRET = 'taskflow_secret_2024';

const protect = (req, res, next) => {
  const auth = req.headers.authorization;


  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido.' });
  }

  try {

    const token = auth.split(' ')[1];

    // jwt.verify lanza un error si el token es inválido o expiró.
    // Si es válido, retorna el payload: { id: 'user-1', iat: ..., exp: ... }
    const decoded = jwt.verify(token, JWT_SECRET);

  
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    req.user = sanitizeUser(user);

   
    next();

  } catch {
    // jwt.verify lanzó error: token inválido, malformado o expirado
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

module.exports = { protect, signToken };
