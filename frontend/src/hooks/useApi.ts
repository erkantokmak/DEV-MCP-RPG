import { useState, useEffect, useCallback } from 'react';
import api, {
  User,
  Project,
  AnalysisReport,
  LeaderboardEntry,
  DashboardStats,
  HealthStatus,
  MCPStatus,
} from '../services/api';

// Generic fetch hook
function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Health check hook
export function useHealth() {
  return useFetch<HealthStatus>(() => api.getHealth(), []);
}

// User hooks
export function useUser(userId: string) {
  return useFetch<User>(() => api.getUser(userId), [userId]);
}

export function useUsers(limit = 20, offset = 0) {
  return useFetch<User[]>(() => api.listUsers(limit, offset), [limit, offset]);
}

// Project hooks
export function useProject(projectId: string) {
  return useFetch<Project>(() => api.getProject(projectId), [projectId]);
}

export function useProjects(limit = 20, offset = 0) {
  return useFetch<Project[]>(() => api.listProjects(limit, offset), [limit, offset]);
}

// Report hooks
export function useReport(reportId: string) {
  return useFetch<AnalysisReport>(() => api.getReport(reportId), [reportId]);
}

export function useReports(projectId?: string, limit = 20, offset = 0) {
  return useFetch<AnalysisReport[]>(
    () => api.listReports(projectId, limit, offset),
    [projectId, limit, offset]
  );
}

// Leaderboard hook
export function useLeaderboard(limit = 10) {
  return useFetch<LeaderboardEntry[]>(() => api.getLeaderboard(limit), [limit]);
}

// Dashboard stats hook
export function useDashboardStats(userId: string) {
  return useFetch<DashboardStats>(() => api.getDashboardStats(userId), [userId]);
}

// MCP Status hook
export function useMCPStatus() {
  return useFetch<MCPStatus>(() => api.getMCPStatus(), []);
}

// Code Analysis hook with mutation
export function useCodeAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<AnalysisReport | null>(null);

  const analyze = useCallback(async (data: {
    code: string;
    language?: string;
    file_path?: string;
    commit_id?: string;
    project_id?: string;
    user_id?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const report = await api.analyzeCode(data);
      setResult(report);
      return report;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, result, loading, error };
}

// Lighthouse analysis hook
export function useLighthouseAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<any>(null);

  const analyze = useCallback(async (url: string, categories?: string[], device?: string) => {
    setLoading(true);
    setError(null);
    try {
      const report = await api.analyzeLighthouse(url, categories, device);
      setResult(report);
      return report;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, result, loading, error };
}
