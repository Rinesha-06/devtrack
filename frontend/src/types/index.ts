export type UserRole = 'PROJECT_MANAGER' | 'DEVELOPER' | 'TESTER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: string;
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  managerId: string;
  teamId?: string;
  repositoryUrl?: string;
  progress: number;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = 'Planned' | 'Active' | 'Completed';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
  createdAt: string;
}

export type StoryStatus = 'TO DO' | 'IN PROGRESS' | 'COMPLETED';

export interface UserStory {
  id: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: PriorityLevel;
  storyPoints: number;
  status: StoryStatus;
  assignedTo?: string;
  createdAt: string;
}

export type TaskStatus = 'TO DO' | 'IN PROGRESS' | 'REVIEW' | 'TESTING' | 'COMPLETED';

export interface Task {
  id: string;
  projectId: string;
  sprintId?: string;
  storyId?: string;
  title: string;
  description: string;
  assignedTo?: string;
  createdBy: string;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  updatedAt: string;
}

export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugStatus = 'OPEN' | 'ASSIGNED' | 'IN PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED' | 'REOPENED';

export interface Bug {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string;
  severity: BugSeverity;
  priority: PriorityLevel;
  status: BugStatus;
  environment: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  role: UserRole;
  addedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: TeamMember[];
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface RepositoryDetails {
  owner: string;
  repo: string;
  url: string;
  defaultBranch: string;
  description?: string;
  stars?: number;
  openIssues?: number;
  latestCommit?: CommitInfo;
  commits?: CommitInfo[];
}

export interface BuildRecord {
  id: string;
  buildNumber: number;
  commit: string;
  branch: string;
  status: 'SUCCESS' | 'FAILURE' | 'WORKING' | 'QUEUED';
  durationSeconds: number;
  timestamp: string;
  logUrl?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalSprints: number;
  activeSprints: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalBugs: number;
  openBugs: number;
  criticalBugs: number;
  resolvedBugs: number;
  closedBugs: number;
  overallProjectProgress: number;
  bugResolutionRate: number;
  taskStatusDistribution: { name: string; value: number; color: string }[];
  bugStatusDistribution: { name: string; value: number; color: string }[];
  bugSeverityDistribution: { name: string; value: number; color: string }[];
  taskPriorityDistribution: { name: string; value: number; color: string }[];
  sprintProgressList: { id: string; name: string; status: string; totalTasks: number; completedTasks: number; progress: number }[];
  recentActivities: Activity[];
}
