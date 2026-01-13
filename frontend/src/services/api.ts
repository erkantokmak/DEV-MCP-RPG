/**
 * Dev-RPG API Service
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  xp_total: number;
  level: number;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository_url?: string;
  owner_id?: string;
  language?: string;
  framework?: string;
  created_at: string;
}

export interface CodeIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  message: string;
  suggestion?: string;
}

export interface AnalysisReport {
  report_id: string;
  overall_score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  code_quality?: {
    score: number;
    issues: CodeIssue[];
    summary: string;
  };
  architecture?: {
    architecture_score: number;
    circular_dependencies: string[];
    layer_violations: string[];
    summary: string;
    recommendations: string[];
  };
  event_loop?: {
    event_loop_score: number;
    blocking_operations: any[];
    estimated_freeze_risk: string;
    summary: string;
  };
  cost_analysis?: {
    efficiency_score: number;
    overall_time_complexity: string;
    overall_space_complexity: string;
    cloud_cost_impact: string;
    summary: string;
    optimizations: string[];
  };
  rpg_summary?: {
    xp_earned: number;
    badges_earned: string[];
    level_up: boolean;
  };
  analyzed_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  xp_total: number;
  level: number;
  avatar_url?: string;
}

export interface DashboardStats {
  total_analyses: number;
  average_score: number;
  xp_earned_today: number;
  active_projects: number;
  recent_badges: string[];
}

export interface MCPStatus {
  [key: string]: {
    url: string;
    status: 'healthy' | 'degraded' | 'unavailable';
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  database: string;
  ollama: string;
  mcps: { [key: string]: string };
  timestamp: string;
}

// API Error handling
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }
  return response.json();
}

// API Methods
export const api = {
  // Health
  async getHealth(): Promise<HealthStatus> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthStatus>(response);
  },

  // Users
  async createUser(data: { username: string; email: string; password: string; display_name?: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
    return handleResponse<User>(response);
  },

  async listUsers(limit = 20, offset = 0): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users?limit=${limit}&offset=${offset}`);
    return handleResponse<User[]>(response);
  },

  // Projects
  async createProject(data: { name: string; description?: string; repository_url?: string; language?: string; framework?: string }, ownerId?: string): Promise<Project> {
    const url = ownerId ? `${API_BASE_URL}/api/projects?owner_id=${ownerId}` : `${API_BASE_URL}/api/projects`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(response);
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
    return handleResponse<Project>(response);
  },

  async listProjects(limit = 20, offset = 0): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects?limit=${limit}&offset=${offset}`);
    return handleResponse<Project[]>(response);
  },

  // Analysis
  async analyzeCode(data: {
    code: string;
    language?: string;
    file_path?: string;
    commit_id?: string;
    project_id?: string;
    user_id?: string;
  }): Promise<AnalysisReport> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AnalysisReport>(response);
  },

  async analyzeLighthouse(url: string, categories?: string[], device?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/lighthouse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, categories, device }),
    });
    return handleResponse(response);
  },

  // Reports
  async getReport(reportId: string): Promise<AnalysisReport> {
    const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`);
    return handleResponse<AnalysisReport>(response);
  },

  async listReports(projectId?: string, limit = 20, offset = 0): Promise<AnalysisReport[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.append('project_id', projectId);
    const response = await fetch(`${API_BASE_URL}/api/reports?${params}`);
    return handleResponse<AnalysisReport[]>(response);
  },

  // Leaderboard
  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${limit}`);
    return handleResponse<LeaderboardEntry[]>(response);
  },

  // Dashboard
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/${userId}`);
    return handleResponse<DashboardStats>(response);
  },

  // MCP Status
  async getMCPStatus(): Promise<MCPStatus> {
    const response = await fetch(`${API_BASE_URL}/api/mcp/status`);
    return handleResponse<MCPStatus>(response);
  },

  // Direct MCP Access
  async callMCP(serviceName: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/mcp/${serviceName}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

export default api;
