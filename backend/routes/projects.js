
const router      = require('express').Router();
const { v4: uuid } = require('uuid');
const { db, sanitizeUser } = require('../data/store');
const { protect } = require('../middleware/auth');

const populate = (project) => ({
  ...project, // Copiamos todas las propiedades originales del proyecto

  owner: sanitizeUser(db.users.find(u => u.id === project.ownerId) || {}),

  // Reemplazamos el array de IDs de miembros por sus objetos completos
  members: project.members
    .map(id => sanitizeUser(db.users.find(u => u.id === id) || {}))
    .filter(u => u.id), // Filtramos por si algún ID no existe

  // Calculamos estadísticas contando tareas por estado
  stats: {
    todo:        db.tasks.filter(t => t.projectId === project.id && t.status === 'todo').length,
    in_progress: db.tasks.filter(t => t.projectId === project.id && t.status === 'in_progress').length,
    in_review:   db.tasks.filter(t => t.projectId === project.id && t.status === 'in_review').length,
    done:        db.tasks.filter(t => t.projectId === project.id && t.status === 'done').length,
  },
});

const hasAccess = (project, userId) =>
  project.ownerId === userId || project.members.includes(userId);

router.get('/', protect, (req, res) => {
  const projects = db.projects
    .filter(p => hasAccess(p, req.user.id)) // Solo sus proyectos
    .map(populate);                          // Enriquecidos con owner, members y stats
  res.json({ success: true, projects });
});

router.get('/:id', protect, (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project)
    return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });

  // Verificamos que el usuario tiene acceso
  if (!hasAccess(project, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  res.json({ success: true, project: populate(project) });
});

router.post('/', protect, (req, res) => {
  const { name, key, description, icon, color } = req.body;

  if (!name || !key)
    return res.status(400).json({ success: false, message: 'Nombre y clave requeridos.' });

  
  if (db.projects.find(p => p.key === key.toUpperCase()))
    return res.status(400).json({ success: false, message: 'La clave ya existe.' });

  const project = {
    id: uuid(),
    name: name.trim(),
    // Normalizamos la clave: mayúsculas, solo alfanumérico, máximo 10 chars
    key: key.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    description: description || '',
    icon: icon || '📋',
    color: color || '#7c6fff',
    status: 'active',
    ownerId: req.user.id,          // El que crea el proyecto es el dueño
    members: [req.user.id],        // El dueño es el primer (y único) miembro inicial
    createdAt: new Date().toISOString(),
  };

  db.projects.push(project);
  res.status(201).json({ success: true, project: populate(project) });
});

router.put('/:id', protect, (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);

  if (idx === -1)
    return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });

  // Solo el dueño puede editar el proyecto
  if (db.projects[idx].ownerId !== req.user.id)
    return res.status(403).json({ success: false, message: 'Solo el dueño puede editar.' });

  // Definimos qué campos se pueden actualizar (whitelist de campos)
  // Así evitamos que alguien cambie campos sensibles como ownerId
  const allowed = ['name', 'description', 'status', 'icon', 'color'];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) db.projects[idx][f] = req.body[f];
  });

  res.json({ success: true, project: populate(db.projects[idx]) });
});

router.delete('/:id', protect, (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);

  if (idx === -1)
    return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });

  if (db.projects[idx].ownerId !== req.user.id)
    return res.status(403).json({ success: false, message: 'Solo el dueño puede eliminar.' });

  // Removemos el proyecto del arreglo
  db.projects.splice(idx, 1);

  // Eliminamos también todas las tareas que pertenecen a este proyecto
  // filter retorna un nuevo arreglo sin las tareas del proyecto eliminado
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id);

  res.json({ success: true, message: 'Proyecto eliminado.' });
});

router.post('/:id/members', protect, (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project)
    return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });

  if (project.ownerId !== req.user.id)
    return res.status(403).json({ success: false, message: 'Sin permiso.' });

  // Buscamos al usuario a agregar por su email
  const user = db.users.find(u => u.email === req.body.email?.toLowerCase());
  if (!user)
    return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

  // Verificamos que no sea ya miembro (evita duplicados)
  if (project.members.includes(user.id))
    return res.status(400).json({ success: false, message: 'Ya es miembro.' });

  // Agregamos el ID del nuevo miembro al array
  project.members.push(user.id);

  res.json({ success: true, project: populate(project) });
});

module.exports = router;
