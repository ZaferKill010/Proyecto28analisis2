
const bcrypt = require('bcryptjs');
const db = {
  users:    [],   // Usuarios registrados
  projects: [],   // Proyectos creados
  tasks:    [],   // Tareas de todos los proyectos
};

function seed() {
  const adminId = 'user-1';
  const devId   = 'user-2';
  const desId   = 'user-3';
  const projId  = 'proj-1';
  const proj2Id = 'proj-2';
  const now     = new Date().toISOString(); // Fecha actual en formato ISO

  db.users = [
    {
      id: adminId,
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: bcrypt.hashSync('Admin1234!', 10), // Contraseña encriptada
      role: 'admin',
      avatar: 'AU',       // Iniciales para mostrar en el avatar
      color: '#7c6fff',   // Color de fondo del avatar
      createdAt: now,
    },
    {
      id: devId,
      name: 'Developer One',
      email: 'dev@taskflow.com',
      password: bcrypt.hashSync('Dev12345!', 10),
      role: 'developer',
      avatar: 'DO',
      color: '#10b981',
      createdAt: now,
    },
    {
      id: desId,
      name: 'Designer Pro',
      email: 'design@taskflow.com',
      password: bcrypt.hashSync('Design123!', 10),
      role: 'designer',
      avatar: 'DP',
      color: '#f472b6',
      createdAt: now,
    },
  ];

  // ── PROYECTOS ─────────────────────────────────────────────────
  db.projects = [
    {
      id: projId,
      name: 'TaskFlow App',
      key: 'TFA',               // Clave corta única del proyecto (como en Jira)
      description: 'Plataforma de gestión de tareas tipo Jira',
      icon: '🚀',
      color: '#7c6fff',
      status: 'active',
      ownerId: adminId,         // Quién creó el proyecto
      members: [adminId, devId, desId], // Quiénes tienen acceso
      createdAt: now,
    },
    {
      id: proj2Id,
      name: 'E-Commerce Platform',
      key: 'ECP',
      description: 'Tienda online con carrito y pagos',
      icon: '🛒',
      color: '#f59e0b',
      status: 'active',
      ownerId: devId,
      members: [devId, adminId],
      createdAt: now,
    },
  ];

  db.tasks = [
    {
      id: 'task-1',
      projectId: projId,
      title: 'Configurar entorno de desarrollo',
      description: 'Instalar Node.js, React y todas las dependencias necesarias.',
      status: 'done',           // Columna en el tablero: todo | in_progress | in_review | done
      priority: 'high',         // Urgencia: low | medium | high | critical
      type: 'task',             // Tipo: task | story | bug | epic
      assigneeId: devId,        // Usuario responsable
      createdBy: adminId,       // Usuario que creó la tarea
      storyPoints: 3,           // Estimación de esfuerzo (metodología Scrum)
      tags: ['setup', 'devops'],
      dueDate: null,
      comments: [
        {
          id: 'c1',
          text: 'Listo, todo instalado correctamente',
          userId: devId,
          createdAt: now,
        },
      ],
      // El history registra automáticamente cada cambio hecho a la tarea
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-2', projectId: projId,
      title: 'Diseñar sistema de autenticación JWT',
      description: 'Implementar login, registro y refresh tokens con JWT.',
      status: 'done', priority: 'critical', type: 'story',
      assigneeId: adminId, createdBy: adminId,
      storyPoints: 5, tags: ['auth', 'security'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-3', projectId: projId,
      title: 'Crear tablero Kanban interactivo',
      description: 'Diseñar el tablero con columnas: Todo, En progreso, En revisión, Listo.',
      status: 'in_progress', priority: 'high', type: 'story',
      assigneeId: desId, createdBy: adminId,
      storyPoints: 8, tags: ['frontend', 'ux'], dueDate: null,
      comments: [{ id: 'c2', text: 'Trabajando en el diseño visual', userId: desId, createdAt: now }],
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-4', projectId: projId,
      title: 'Corregir bug en filtros de búsqueda',
      description: 'Al filtrar por prioridad y asignado al mismo tiempo, el resultado es incorrecto.',
      status: 'in_progress', priority: 'critical', type: 'bug',
      assigneeId: devId, createdBy: devId,
      storyPoints: 2, tags: ['bug', 'filters'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: devId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-5', projectId: projId,
      title: 'Implementar sistema de comentarios',
      description: 'Agregar comentarios en tiempo real en cada tarea con avatares de usuario.',
      status: 'in_review', priority: 'medium', type: 'story',
      assigneeId: devId, createdBy: adminId,
      storyPoints: 5, tags: ['comments', 'realtime'], dueDate: null,
      comments: [{ id: 'c3', text: 'PR listo para revisar', userId: devId, createdAt: now }],
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-6', projectId: projId,
      title: 'Diseñar landing page del producto',
      description: 'Crear una landing page atractiva con hero, features y pricing.',
      status: 'todo', priority: 'medium', type: 'task',
      assigneeId: desId, createdBy: adminId,
      storyPoints: 5, tags: ['design', 'marketing'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-7', projectId: projId,
      title: 'Configurar CI/CD con GitHub Actions',
      description: 'Pipeline de deploy automático al hacer push a main.',
      status: 'todo', priority: 'low', type: 'task',
      assigneeId: null,  // Nadie asignado todavía
      createdBy: adminId,
      storyPoints: 3, tags: ['devops', 'ci-cd'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: adminId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-8', projectId: proj2Id,
      title: 'Integrar pasarela de pago Stripe',
      description: 'Checkout con tarjetas, soporte de reembolsos y webhooks.',
      status: 'in_progress', priority: 'critical', type: 'epic',
      assigneeId: devId, createdBy: devId,
      storyPoints: 13, tags: ['payments', 'stripe'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: devId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task-9', projectId: proj2Id,
      title: 'Diseñar catálogo de productos',
      description: 'Grid de productos con filtros, búsqueda y paginación.',
      status: 'todo', priority: 'high', type: 'story',
      assigneeId: adminId, createdBy: devId,
      storyPoints: 8, tags: ['frontend', 'catalog'], dueDate: null,
      comments: [],
      history: [{ action: 'created', userId: devId, createdAt: now }],
      createdAt: now, updatedAt: now,
    },
  ];
}

seed();

const findById = (col, id) => db[col].find(item => item.id === id) || null;

const sanitizeUser = (u) => {
  const { password, ...rest } = u; // Desestructuramos quitando "password"
  return rest;                      // Devolvemos todo MENOS la contraseña
};


module.exports = { db, findById, sanitizeUser };
