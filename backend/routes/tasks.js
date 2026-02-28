// ============================================================
//  routes/tasks.js — CRUD completo de tareas
// ============================================================
//  Endpoints:
//    GET    /api/tasks              → Listar tareas (con filtros)
//    GET    /api/tasks/:id          → Detalle de una tarea
//    POST   /api/tasks              → Crear tarea
//    PUT    /api/tasks/:id          → Editar tarea (guarda historial)
//    PUT    /api/tasks/:id/status   → Cambio rápido de estado
//    DELETE /api/tasks/:id          → Eliminar tarea
//    POST   /api/tasks/:id/comments → Agregar comentario
// ============================================================

const router      = require('express').Router();
const { v4: uuid } = require('uuid');
const { db, sanitizeUser } = require('../data/store');
const { protect } = require('../middleware/auth');

// ── Función auxiliar: enriquecer una tarea con objetos completos ──
// Reemplaza los IDs (strings) por los objetos reales de usuario
const populateTask = (task) => ({
  ...task,
  // assigneeId (string) → objeto completo del usuario asignado (o null)
  assignee: task.assigneeId
    ? sanitizeUser(db.users.find(u => u.id === task.assigneeId) || {})
    : null,
  // createdBy (string) → objeto del creador
  creator:  sanitizeUser(db.users.find(u => u.id === task.createdBy) || {}),
  // Cada comentario también enriquecemos con el objeto del usuario
  comments: task.comments.map(c => ({
    ...c,
    user: sanitizeUser(db.users.find(u => u.id === c.userId) || {}),
  })),
});

// ── Función auxiliar: verificar acceso al proyecto de la tarea ──
// Devuelve el proyecto si el usuario tiene acceso, o null si no.
const projectAccess = (projectId, userId) => {
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return null;
  // Sin acceso si no es dueño ni miembro
  if (project.ownerId !== userId && !project.members.includes(userId)) return null;
  return project;
};

// ── GET /api/tasks ────────────────────────────────────────────
// Lista tareas con filtros opcionales via query params.
// Ejemplo: GET /api/tasks?projectId=proj-1&status=in_progress&priority=high
router.get('/', protect, (req, res) => {
  const { projectId, status, assigneeId, priority, type } = req.query;
  let tasks = db.tasks; // Empezamos con todas las tareas

  if (projectId) {
    // Si filtra por proyecto, verificamos acceso primero
    if (!projectAccess(projectId, req.user.id))
      return res.status(403).json({ success: false, message: 'Sin acceso al proyecto.' });
    tasks = tasks.filter(t => t.projectId === projectId);
  } else {
    // Sin projectId → mostramos solo tareas de los proyectos accesibles
    const myProjectIds = db.projects
      .filter(p => p.ownerId === req.user.id || p.members.includes(req.user.id))
      .map(p => p.id);
    tasks = tasks.filter(t => myProjectIds.includes(t.projectId));
  }

  // Aplicamos cada filtro si fue enviado
  if (status)     tasks = tasks.filter(t => t.status === status);

  // assigneeId='me' es un valor especial para "mis tareas asignadas"
  if (assigneeId === 'me') tasks = tasks.filter(t => t.assigneeId === req.user.id);
  else if (assigneeId)     tasks = tasks.filter(t => t.assigneeId === assigneeId);

  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (type)     tasks = tasks.filter(t => t.type === type);

  res.json({ success: true, count: tasks.length, tasks: tasks.map(populateTask) });
});

// ── GET /api/tasks/:id ────────────────────────────────────────
// Devuelve una tarea completa con comentarios e historial.
router.get('/:id', protect, (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada.' });

  if (!projectAccess(task.projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  res.json({ success: true, task: populateTask(task) });
});

// ── POST /api/tasks ───────────────────────────────────────────
// Crea una nueva tarea en un proyecto.
router.post('/', protect, (req, res) => {
  const { title, projectId, status, priority, type,
          assigneeId, description, storyPoints, dueDate, tags } = req.body;

  if (!title || !projectId)
    return res.status(400).json({ success: false, message: 'Título y proyecto requeridos.' });

  if (!projectAccess(projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso al proyecto.' });

  const now = new Date().toISOString();
  const task = {
    id: uuid(),
    projectId,
    title: title.trim(),
    description: description || '',
    status:   status   || 'todo',    // Por defecto entra en "Por hacer"
    priority: priority || 'medium',
    type:     type     || 'task',
    assigneeId: assigneeId || null,
    createdBy:  req.user.id,          // El usuario que llama la API es el creador
    storyPoints: parseInt(storyPoints) || 0,
    dueDate:  dueDate || null,
    // Procesamos tags: si llegan como array los usamos, si es string lo separamos por coma
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    comments: [],
    // El history empieza con el evento de creación
    history: [{ action: 'created', userId: req.user.id, createdAt: now }],
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.push(task);
  // Respondemos con la tarea enriquecida (con objetos de usuario, no solo IDs)
  res.status(201).json({ success: true, task: populateTask(task) });
});

// ── PUT /api/tasks/:id ────────────────────────────────────────
// Actualiza campos de la tarea y registra los cambios en el historial.
router.put('/:id', protect, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Tarea no encontrada.' });

  if (!projectAccess(db.tasks[idx].projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  // Lista de campos que se pueden actualizar (whitelist)
  const allowed = ['title','description','status','priority','type',
                   'assigneeId','storyPoints','dueDate','tags'];
  const now = new Date().toISOString();
  const historyEntries = []; // Cambios que agregaremos al historial

  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      // Comparamos valor anterior con el nuevo para detectar si realmente cambió
      const oldVal = String(db.tasks[idx][field] ?? '');
      const newVal = String(req.body[field] ?? '');

      if (oldVal !== newVal) {
        // Si cambió, creamos una entrada en el historial
        historyEntries.push({
          action:   'updated',
          field,               // ¿Qué campo cambió?
          oldValue: db.tasks[idx][field], // Valor anterior
          newValue: req.body[field],      // Valor nuevo
          userId:   req.user.id,          // ¿Quién lo cambió?
          createdAt: now,
        });
      }

      // Actualizamos el campo en memoria
      db.tasks[idx][field] = req.body[field];
    }
  });

  // Procesamiento especial para tags (puede venir como string separado por comas)
  if (req.body.tags && !Array.isArray(req.body.tags)) {
    db.tasks[idx].tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  // storyPoints siempre debe ser número entero
  if (req.body.storyPoints !== undefined)
    db.tasks[idx].storyPoints = parseInt(req.body.storyPoints) || 0;

  // Agregamos todas las entradas de historial al arreglo existente
  // push(...array) agrega múltiples elementos a la vez
  db.tasks[idx].history.push(...historyEntries);
  db.tasks[idx].updatedAt = now;

  res.json({ success: true, task: populateTask(db.tasks[idx]) });
});

// ── PUT /api/tasks/:id/status ─────────────────────────────────
// Cambio rápido de estado (para el drag del kanban o el selector).
// Separado del PUT general para que sea una operación simple y directa.
router.put('/:id/status', protect, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Tarea no encontrada.' });

  if (!projectAccess(db.tasks[idx].projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  // Validamos que el status sea uno de los valores permitidos
  const valid = ['todo','in_progress','in_review','done'];
  if (!valid.includes(req.body.status))
    return res.status(400).json({ success: false, message: 'Estado inválido.' });

  const now = new Date().toISOString();

  // Registramos el cambio de estado en el historial
  db.tasks[idx].history.push({
    action:   'status_changed',
    field:    'status',
    oldValue: db.tasks[idx].status, // Estado anterior
    newValue: req.body.status,       // Estado nuevo
    userId:   req.user.id,
    createdAt: now,
  });

  // Aplicamos el cambio
  db.tasks[idx].status    = req.body.status;
  db.tasks[idx].updatedAt = now;

  res.json({ success: true, task: populateTask(db.tasks[idx]) });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────
// Elimina permanentemente una tarea.
router.delete('/:id', protect, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Tarea no encontrada.' });

  if (!projectAccess(db.tasks[idx].projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  // splice(índice, cantidad) elimina 1 elemento en la posición idx
  db.tasks.splice(idx, 1);

  res.json({ success: true, message: 'Tarea eliminada.' });
});

// ── POST /api/tasks/:id/comments ─────────────────────────────
// Agrega un comentario a una tarea.
router.post('/:id/comments', protect, (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada.' });

  if (!projectAccess(task.projectId, req.user.id))
    return res.status(403).json({ success: false, message: 'Sin acceso.' });

  if (!req.body.text?.trim())
    return res.status(400).json({ success: false, message: 'Comentario vacío.' });

  const comment = {
    id:        uuid(),
    text:      req.body.text.trim(),
    userId:    req.user.id,              // Quién comentó
    createdAt: new Date().toISOString(),
  };

  // Agregamos el comentario al array de comentarios de la tarea
  task.comments.push(comment);

  // Devolvemos todos los comentarios enriquecidos con datos del usuario
  res.json({
    success: true,
    comments: task.comments.map(c => ({
      ...c,
      user: sanitizeUser(db.users.find(u => u.id === c.userId) || {}),
    })),
  });
});

module.exports = router;
