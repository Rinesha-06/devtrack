import bcrypt from 'bcryptjs';
import { db } from '../repositories/firestoreRepository';
import { User, Project, Team, Sprint, UserStory, Task, Bug, Activity, Notification } from '../models/types';

export async function seedDemoData() {
  console.log('[Seed] Seeding realistic DevTrack demo data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const users: User[] = [
    {
      id: 'user_pm_01',
      name: 'Sarah Chen',
      email: 'pm@devtrack.io',
      role: 'PROJECT_MANAGER',
      passwordHash,
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_dev_01',
      name: 'Alex Rivera',
      email: 'dev@devtrack.io',
      role: 'DEVELOPER',
      passwordHash,
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_qa_01',
      name: 'Priya Sharma',
      email: 'tester@devtrack.io',
      role: 'TESTER',
      passwordHash,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const u of users) {
    await db.create('users', u);
  }

  // 2. Teams
  const teams: Team[] = [
    {
      id: 'team_core_01',
      name: 'DevTrack Engineering Core',
      description: 'Cross-functional engineering pod responsible for Cloud Run microservices & frontend UI',
      projectId: 'proj_devtrack_01',
      createdBy: 'user_pm_01',
      members: [
        { userId: 'user_pm_01', name: 'Sarah Chen', email: 'pm@devtrack.io', role: 'PROJECT_MANAGER', addedAt: new Date().toISOString() },
        { userId: 'user_dev_01', name: 'Alex Rivera', email: 'dev@devtrack.io', role: 'DEVELOPER', addedAt: new Date().toISOString() },
        { userId: 'user_qa_01', name: 'Priya Sharma', email: 'tester@devtrack.io', role: 'TESTER', addedAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'team_cloud_02',
      name: 'Cloud Infrastructure & DevOps Pod',
      description: 'Specialized pod for CI/CD pipelines, container deployments, and monitoring',
      projectId: 'proj_ecommerce_02',
      createdBy: 'user_pm_01',
      members: [
        { userId: 'user_pm_01', name: 'Sarah Chen', email: 'pm@devtrack.io', role: 'PROJECT_MANAGER', addedAt: new Date().toISOString() },
        { userId: 'user_dev_01', name: 'Alex Rivera', email: 'dev@devtrack.io', role: 'DEVELOPER', addedAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const t of teams) {
    await db.create('teams', t);
  }

  // 3. Projects
  const projects: Project[] = [
    {
      id: 'proj_devtrack_01',
      name: 'DevTrack Platform',
      description: 'Cloud-native integrated software project management system deployed on Google Cloud Run with Firestore database.',
      startDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 40 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      priority: 'HIGH',
      managerId: 'user_pm_01',
      teamId: 'team_core_01',
      repositoryUrl: 'https://github.com/Rinesha-06/devtrack',
      progress: 68,
      members: ['user_pm_01', 'user_dev_01', 'user_qa_01'],
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'proj_ecommerce_02',
      name: 'E-Commerce Cloud Store',
      description: 'Scalable multi-tenant retail storefront with microservices and real-time checkout.',
      startDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      priority: 'MEDIUM',
      managerId: 'user_pm_01',
      teamId: 'team_core_01',
      repositoryUrl: 'https://github.com/google/ecommerce-demo',
      progress: 35,
      members: ['user_pm_01', 'user_dev_01'],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const p of projects) {
    await db.create('projects', p);
  }

  // 4. Sprints
  const sprints: Sprint[] = [
    {
      id: 'sprint_01',
      projectId: 'proj_devtrack_01',
      name: 'Sprint 1 — Core Auth & Architecture',
      goal: 'Establish Cloud Run base container, Firestore collections, and JWT Authentication.',
      startDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      status: 'Completed',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sprint_02',
      projectId: 'proj_devtrack_01',
      name: 'Sprint 2 — Project & Backlog Management',
      goal: 'Deliver user story backlog, task status progression, and Kanban board.',
      startDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sprint_03',
      projectId: 'proj_devtrack_01',
      name: 'Sprint 3 — Bug Tracking & DevOps CI/CD',
      goal: 'Implement bug triage workflow, GitHub telemetry, and Cloud Build pipeline.',
      startDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 86400000).toISOString().split('T')[0],
      status: 'Planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const s of sprints) {
    await db.create('sprints', s);
  }

  // 5. User Stories
  const stories: UserStory[] = [
    {
      id: 'story_01',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_01',
      title: 'User Authentication & RBAC',
      description: 'As a user, I want to securely log in and access role-specific functionality.',
      acceptanceCriteria: 'Support Project Manager, Developer, and Tester roles with JWT token.',
      priority: 'CRITICAL',
      storyPoints: 5,
      status: 'COMPLETED',
      assignedTo: 'user_dev_01',
      createdAt: new Date(Date.now() - 19 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'story_02',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_02',
      title: 'Interactive Kanban Board',
      description: 'As a team member, I want to track and drag tasks through workflow columns.',
      acceptanceCriteria: 'Support To Do, In Progress, Review, Testing, Completed states with live sync.',
      priority: 'HIGH',
      storyPoints: 8,
      status: 'IN PROGRESS',
      assignedTo: 'user_dev_01',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'story_03',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_02',
      title: 'Real-time Project Analytics',
      description: 'As a Project Manager, I want centralized dashboards with Recharts data visualizations.',
      acceptanceCriteria: 'Display task breakdown, bug severity, sprint velocity, and resolution rate.',
      priority: 'HIGH',
      storyPoints: 5,
      status: 'IN PROGRESS',
      assignedTo: 'user_dev_01',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const st of stories) {
    await db.create('userStories', st);
  }

  // 6. Tasks
  const tasks: Task[] = [
    {
      id: 'task_01',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_01',
      storyId: 'story_01',
      title: 'Implement JWT Auth & Password Hashing',
      description: 'Configure bcrypt hashing and token generation middleware.',
      assignedTo: 'user_dev_01',
      createdBy: 'user_pm_01',
      priority: 'CRITICAL',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      estimatedHours: 8,
      actualHours: 7,
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_02',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_01',
      storyId: 'story_01',
      title: 'Setup Firestore Database Client',
      description: 'Configure Google Cloud Firestore with fallback local persistence layer.',
      assignedTo: 'user_dev_01',
      createdBy: 'user_pm_01',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
      estimatedHours: 6,
      actualHours: 6,
      createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_03',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_02',
      storyId: 'story_02',
      title: 'Build Kanban Board Drag-and-Drop Columns',
      description: 'Create multi-column board with TO DO, IN PROGRESS, REVIEW, TESTING, COMPLETED.',
      assignedTo: 'user_dev_01',
      createdBy: 'user_pm_01',
      priority: 'HIGH',
      status: 'IN PROGRESS',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      estimatedHours: 12,
      actualHours: 6,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_04',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_02',
      storyId: 'story_03',
      title: 'Connect Recharts Dashboard Statistics',
      description: 'Render distribution charts and progress bars using real Firestore queries.',
      assignedTo: 'user_dev_01',
      createdBy: 'user_pm_01',
      priority: 'MEDIUM',
      status: 'REVIEW',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      estimatedHours: 8,
      actualHours: 7,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_05',
      projectId: 'proj_devtrack_01',
      sprintId: 'sprint_02',
      title: 'Run Automated QA Regression Suite',
      description: 'Verify API endpoints, authorization boundaries, and edge-case validation.',
      assignedTo: 'user_qa_01',
      createdBy: 'user_pm_01',
      priority: 'HIGH',
      status: 'TESTING',
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      estimatedHours: 10,
      actualHours: 5,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_06',
      projectId: 'proj_devtrack_01',
      title: 'Configure Cloud Build & Artifact Registry CI/CD',
      description: 'Author cloudbuild.yaml and test containerized deployment on Cloud Run.',
      assignedTo: 'user_dev_01',
      createdBy: 'user_pm_01',
      priority: 'MEDIUM',
      status: 'TO DO',
      dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
      estimatedHours: 6,
      actualHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const t of tasks) {
    await db.create('tasks', t);
  }

  // 7. Bugs
  const bugs: Bug[] = [
    {
      id: 'bug_01',
      projectId: 'proj_devtrack_01',
      taskId: 'task_01',
      title: 'Login validation error with complex passwords',
      description: 'Special characters in passwords occasionally cause decoding mismatch.',
      reportedBy: 'user_qa_01',
      assignedTo: 'user_dev_01',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'FIXED',
      environment: 'Testing / Cloud Run Staging',
      stepsToReproduce: '1. Register with password containing !@#$%^&*()\n2. Attempt login',
      expectedResult: 'Successful authentication token return',
      actualResult: '401 Unauthorized',
      resolution: 'Fixed string encoding in body parser and bcrypt compare payload.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bug_02',
      projectId: 'proj_devtrack_01',
      taskId: 'task_04',
      title: 'Dashboard chart tooltip clipping on mobile screen',
      description: 'Recharts responsive container overflows viewport on width < 480px.',
      reportedBy: 'user_qa_01',
      assignedTo: 'user_dev_01',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'IN PROGRESS',
      environment: 'Mobile Chrome / iOS Safari',
      stepsToReproduce: 'Open Dashboard on screen width 390px, tap pie chart wedge.',
      expectedResult: 'Tooltip renders within viewport boundaries',
      actualResult: 'Horizontal scroll triggered',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bug_03',
      projectId: 'proj_devtrack_01',
      taskId: 'task_05',
      title: 'Sprint progress calculation returns NaN when 0 tasks exist',
      description: 'Division by zero occurred when a freshly created sprint had no assigned tasks.',
      reportedBy: 'user_qa_01',
      assignedTo: 'user_dev_01',
      severity: 'LOW',
      priority: 'LOW',
      status: 'CLOSED',
      environment: 'Local & Cloud Run',
      stepsToReproduce: 'Create empty sprint and view progress percentage.',
      expectedResult: 'Display 0% progress',
      actualResult: 'Displayed NaN%',
      resolution: 'Added ternary check fallback to 0 when totalTasks === 0.',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const b of bugs) {
    await db.create('bugs', b);
  }

  // 8. Activities
  const activities: Activity[] = [
    {
      id: 'act_01',
      projectId: 'proj_devtrack_01',
      userId: 'user_pm_01',
      userName: 'Sarah Chen',
      action: 'PROJECT_CREATED',
      details: 'Created project "DevTrack Platform"',
      timestamp: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'act_02',
      projectId: 'proj_devtrack_01',
      userId: 'user_pm_01',
      userName: 'Sarah Chen',
      action: 'SPRINT_CREATED',
      details: 'Created Sprint 2 — Project & Backlog Management',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'act_03',
      projectId: 'proj_devtrack_01',
      userId: 'user_dev_01',
      userName: 'Alex Rivera',
      action: 'TASK_STATUS_CHANGED',
      details: 'Moved "Build Kanban Board Drag-and-Drop Columns" to IN PROGRESS',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'act_04',
      projectId: 'proj_devtrack_01',
      userId: 'user_qa_01',
      userName: 'Priya Sharma',
      action: 'BUG_REPORTED',
      details: 'Reported BUG "Dashboard chart tooltip clipping on mobile screen"',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'act_05',
      projectId: 'proj_devtrack_01',
      userId: 'user_dev_01',
      userName: 'Alex Rivera',
      action: 'BUG_STATUS_CHANGED',
      details: 'Marked bug "Login validation error" as FIXED',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ];

  for (const a of activities) {
    await db.create('activities', a);
  }

  // 9. Notifications
  const notifications: Notification[] = [
    {
      id: 'notif_01',
      userId: 'user_dev_01',
      title: 'New Task Assigned',
      message: 'Sarah Chen assigned you "Build Kanban Board Drag-and-Drop Columns"',
      read: false,
      link: '/tasks',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'notif_02',
      userId: 'user_dev_01',
      title: 'Bug Assigned to You',
      message: 'Priya Sharma reported bug "Dashboard chart tooltip clipping"',
      read: false,
      link: '/bugs',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'notif_03',
      userId: 'user_pm_01',
      title: 'Bug Fixed',
      message: 'Alex Rivera marked bug "Login validation error" as FIXED',
      read: true,
      link: '/bugs',
      createdAt: new Date(Date.now() - 10 * 3600000).toISOString()
    }
  ];

  for (const n of notifications) {
    await db.create('notifications', n);
  }

  console.log('[Seed] Sample demo data seeded successfully!');
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
