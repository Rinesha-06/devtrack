process.env.USE_LOCAL_DB = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

import request from 'supertest';
import app from '../src/index';
import { db } from '../src/repositories/firestoreRepository';
import { seedDemoData } from '../src/utils/seedData';

jest.setTimeout(30000);

describe('DevTrack Complete API Test Suite', () => {
  let pmToken: string;
  let devToken: string;
  let testerToken: string;
  let createdProjectId: string;
  let createdSprintId: string;
  let createdTaskId: string;
  let createdBugId: string;

  beforeAll(async () => {
    // Seed initial data
    await seedDemoData();

    // Authenticate PM
    const pmLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pm@devtrack.io', password: 'password123' });
    expect(pmLogin.status).toBe(200);
    pmToken = pmLogin.body.token;

    // Authenticate Dev
    const devLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@devtrack.io', password: 'password123' });
    expect(devLogin.status).toBe(200);
    devToken = devLogin.body.token;

    // Authenticate Tester
    const testerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@devtrack.io', password: 'password123' });
    expect(testerLogin.status).toBe(200);
    testerToken = testerLogin.body.token;
  }, 30000);

  describe('1. Health and Authentication', () => {
    it('GET /api/health should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('devtrack-backend');
    });

    it('GET /api/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('pm@devtrack.io');
      expect(res.body.user.role).toBe('PROJECT_MANAGER');
    });

    it('GET /api/auth/me should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/register should create a new developer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Engineer',
          email: `new_engineer_${Date.now()}@devtrack.io`,
          password: 'password123',
          role: 'DEVELOPER'
        });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('DEVELOPER');
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'pm@devtrack.io', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('2. Role-Based Access Control (RBAC) & Projects', () => {
    it('POST /api/projects should be permitted for PROJECT_MANAGER', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          name: 'Academic Cloud Run Suite',
          description: 'Testing RBAC enforcement on Cloud Run architecture',
          priority: 'HIGH'
        });
      expect(res.status).toBe(201);
      expect(res.body.project.name).toBe('Academic Cloud Run Suite');
      createdProjectId = res.body.project.id;
    });

    it('POST /api/projects should be FORBIDDEN (403) for DEVELOPER', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          name: 'Unauthorized Project Attempt',
          description: 'Should fail'
        });
      expect(res.status).toBe(403);
    });

    it('GET /api/projects should list all projects for authenticated users', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${devToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.projects.length).toBeGreaterThan(0);
    });

    it('GET /api/projects/:id should return single project details', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.project.id).toBe(createdProjectId);
    });
  });

  describe('3. Agile Sprints & User Stories', () => {
    it('POST /api/sprints should allow PM to create a Sprint', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          projectId: createdProjectId,
          name: 'Sprint Alpha',
          goal: 'Demonstrate end-to-end Agile lifecycle',
          status: 'Active'
        });
      expect(res.status).toBe(201);
      expect(res.body.sprint.name).toBe('Sprint Alpha');
      createdSprintId = res.body.sprint.id;
    });

    it('POST /api/stories should create a User Story', async () => {
      const res = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          projectId: createdProjectId,
          sprintId: createdSprintId,
          title: 'As an M.Tech student, I want to deploy to Cloud Run',
          description: 'Ensure scale-to-zero microservice architecture',
          storyPoints: 5,
          priority: 'HIGH'
        });
      expect(res.status).toBe(201);
      expect(res.body.story.title).toContain('M.Tech student');
    });

    it('GET /api/sprints/:id should return computed progress', async () => {
      const res = await request(app)
        .get(`/api/sprints/${createdSprintId}`)
        .set('Authorization', `Bearer ${devToken}`);
      expect(res.status).toBe(200);
      expect(res.body.sprint.progress).toBeDefined();
    });
  });

  describe('4. Task Management Lifecycle & Transitions', () => {
    it('POST /api/tasks should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          projectId: createdProjectId,
          sprintId: createdSprintId,
          title: 'Configure Cloud Run Container',
          description: 'Deploy dockerized Node Express service',
          assignedTo: 'user_dev_01',
          priority: 'CRITICAL',
          status: 'TO DO',
          estimatedHours: 4
        });
      expect(res.status).toBe(201);
      expect(res.body.task.status).toBe('TO DO');
      createdTaskId = res.body.task.id;
    });

    it('PATCH /api/tasks/:id/status should transition status: TO DO -> IN PROGRESS -> COMPLETED', async () => {
      // 1. Move to IN PROGRESS
      const step1 = await request(app)
        .patch(`/api/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'IN PROGRESS' });
      expect(step1.status).toBe(200);
      expect(step1.body.task.status).toBe('IN PROGRESS');

      // 2. Move to COMPLETED
      const step2 = await request(app)
        .patch(`/api/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'COMPLETED' });
      expect(step2.status).toBe(200);
      expect(step2.body.task.status).toBe('COMPLETED');
      expect(step2.body.projectProgress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Bug Tracking Lifecycle', () => {
    it('POST /api/bugs should allow Tester to report a bug', async () => {
      const res = await request(app)
        .post('/api/bugs')
        .set('Authorization', `Bearer ${testerToken}`)
        .send({
          projectId: createdProjectId,
          taskId: createdTaskId,
          title: 'Memory limit exceeded on high load',
          description: 'Scale-to-zero instance cold-start delay',
          severity: 'HIGH',
          priority: 'HIGH',
          environment: 'Google Cloud Run'
        });
      expect(res.status).toBe(201);
      expect(res.body.bug.status).toBe('OPEN');
      createdBugId = res.body.bug.id;
    });

    it('PATCH /api/bugs/:id/status should transition: OPEN -> FIXED -> CLOSED', async () => {
      // Dev fixes bug
      const fixRes = await request(app)
        .patch(`/api/bugs/${createdBugId}/status`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'FIXED', resolution: 'Configured Cloud Run min-instances to 0 and increased memory to 512MB' });
      expect(fixRes.status).toBe(200);
      expect(fixRes.body.bug.status).toBe('FIXED');

      // Tester verifies and closes
      const closeRes = await request(app)
        .patch(`/api/bugs/${createdBugId}/status`)
        .set('Authorization', `Bearer ${testerToken}`)
        .send({ status: 'CLOSED' });
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.bug.status).toBe('CLOSED');
    });
  });

  describe('6. Dashboard Analytics, GitHub & CI/CD Telemetry', () => {
    it('GET /api/dashboard/stats should compute real database statistics', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      const { stats } = res.body;
      expect(stats.totalProjects).toBeGreaterThan(0);
      expect(stats.totalTasks).toBeGreaterThan(0);
      expect(stats.taskStatusDistribution).toBeDefined();
      expect(stats.bugStatusDistribution).toBeDefined();
      expect(stats.recentActivities.length).toBeGreaterThan(0);
    });

    it('GET /api/github/repository should return repository information safely', async () => {
      const res = await request(app)
        .get('/api/github/repository?url=https://github.com/google/devtrack-demo')
        .set('Authorization', `Bearer ${devToken}`);
      expect(res.status).toBe(200);
      expect(res.body.repository.owner).toBeDefined();
      expect(res.body.repository.commits).toBeDefined();
    });

    it('GET /api/cicd/builds should return Cloud Build pipeline history', async () => {
      const res = await request(app)
        .get('/api/cicd/builds')
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pipeline.name).toBe('devtrack-cloud-build-pipeline');
      expect(Array.isArray(res.body.builds)).toBe(true);
    });
  });

  describe('7. Team & Team Member Management (PM Feature)', () => {
    let testTeamId: string;
    let addedMemberUserId: string;

    it('POST /api/teams should allow PM to create a team assigned to a project', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          name: 'Security & Platform Pod',
          description: 'Responsible for IAM, TLS encryption, and secure APIs',
          projectId: createdProjectId
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team.name).toBe('Security & Platform Pod');
      expect(res.body.team.projectId).toBe(createdProjectId);
      expect(Array.isArray(res.body.team.members)).toBe(true);
      testTeamId = res.body.team.id;
    });

    it('POST /api/teams should reject non-PM user with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          name: 'Unauthorized Pod'
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('POST /api/teams/:id/members should allow PM to add a member with name, email, and role', async () => {
      const res = await request(app)
        .post(`/api/teams/${testTeamId}/members`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          name: 'Jordan Lee',
          email: 'jordan.lee@devtrack.io',
          role: 'DEVELOPER'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.member.role).toBe('DEVELOPER');
      expect(res.body.member.email).toBe('jordan.lee@devtrack.io');
      addedMemberUserId = res.body.member.userId;
      expect(addedMemberUserId).toBeDefined();

      const found = res.body.team.members.find((m: any) => m.userId === addedMemberUserId);
      expect(found).toBeDefined();
      expect(found.role).toBe('DEVELOPER');
    });

    it('POST /api/teams/:id/members should reject non-PM user with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/teams/${testTeamId}/members`)
        .set('Authorization', `Bearer ${testerToken}`)
        .send({
          name: 'Hacker User',
          email: 'hacker@devtrack.io',
          role: 'DEVELOPER'
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/teams/:id/members/:userId should allow PM to edit member details and change role', async () => {
      const res = await request(app)
        .put(`/api/teams/${testTeamId}/members/${addedMemberUserId}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          name: 'Jordan Lee Senior',
          email: 'jordan.senior@devtrack.io',
          role: 'TESTER'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.member.role).toBe('TESTER');
      expect(res.body.member.name).toBe('Jordan Lee Senior');
      expect(res.body.member.email).toBe('jordan.senior@devtrack.io');
    });

    it('PUT /api/teams/:id/members/:userId should reject non-PM with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/teams/${testTeamId}/members/${addedMemberUserId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          role: 'PROJECT_MANAGER'
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/teams should list teams and persist member data correctly', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const team = res.body.teams.find((t: any) => t.id === testTeamId);
      expect(team).toBeDefined();
      expect(team.name).toBe('Security & Platform Pod');
      const member = team.members.find((m: any) => m.userId === addedMemberUserId);
      expect(member).toBeDefined();
      expect(member.name).toBe('Jordan Lee Senior');
      expect(member.role).toBe('TESTER');
    });

    it('DELETE /api/teams/:id/members/:userId should reject non-PM with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/teams/${testTeamId}/members/${addedMemberUserId}`)
        .set('Authorization', `Bearer ${testerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/teams/:id/members/:userId should allow PM to remove member from team', async () => {
      const res = await request(app)
        .delete(`/api/teams/${testTeamId}/members/${addedMemberUserId}`)
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const memberStillExists = res.body.team.members.some((m: any) => m.userId === addedMemberUserId);
      expect(memberStillExists).toBe(false);
    });

    it('DELETE /api/teams/:id should allow PM to delete a team', async () => {
      const res = await request(app)
        .delete(`/api/teams/${testTeamId}`)
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });
});
