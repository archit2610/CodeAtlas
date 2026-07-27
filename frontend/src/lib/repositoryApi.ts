import { api } from './api';
import { API_URL } from './constants';
import type {
  Repository,
  RepositoryFileSummary,
  RepositoryFileDetail,
  AgentRun,
  Conversation,
  BlastRadiusResult,
  RouteInspectionResult
} from '../types';

export interface GraphData {
  nodes: Array<{ id: string; label: string; classification: string; lineCount: number }>;
  edges: Array<{ source: string; target: string; sourceLine: number; edgeType: string }>;
}

export const repositoryApi = {
  importDemo: async (): Promise<Repository> => {
    const res = await api.post<{ repository: Repository }>('/repositories/demo');
    return res.data.repository;
  },

  importGithub: async (url: string): Promise<Repository> => {
    const res = await api.post<{ repository: Repository }>('/repositories/import', { url });
    return res.data.repository;
  },

  getRepository: async (id: string): Promise<Repository> => {
    const res = await api.get<{ repository: Repository }>(`/repositories/${id}`);
    return res.data.repository;
  },

  getTree: async (id: string): Promise<RepositoryFileSummary[]> => {
    const res = await api.get<{ files: RepositoryFileSummary[] }>(`/repositories/${id}/tree`);
    return res.data.files;
  },

  getFile: async (id: string, filePath: string): Promise<RepositoryFileDetail> => {
    const encoded = encodeURIComponent(filePath);
    const res = await api.get<{ file: RepositoryFileDetail }>(`/repositories/${id}/files/${encoded}`);
    return res.data.file;
  },

  searchFiles: async (id: string, query: string): Promise<RepositoryFileSummary[]> => {
    const encoded = encodeURIComponent(query);
    const res = await api.get<{ files: RepositoryFileSummary[] }>(`/repositories/${id}/search?q=${encoded}`);
    return res.data.files;
  },

  getImpact: async (id: string, filePath: string): Promise<BlastRadiusResult> => {
    const encoded = encodeURIComponent(filePath);
    const res = await api.get<{ impact: BlastRadiusResult }>(`/repositories/${id}/impact?file=${encoded}`);
    return res.data.impact;
  },

  getRoutes: async (id: string): Promise<RouteInspectionResult> => {
    const res = await api.get<{ routeMap: RouteInspectionResult }>(`/repositories/${id}/routes`);
    return res.data.routeMap;
  },

  getGraph: async (id: string): Promise<GraphData> => {
    const res = await api.get<{ graph: GraphData }>(`/repositories/${id}/graph`);
    return res.data.graph;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<{ conversations: Conversation[] }>('/conversations');
    return res.data.conversations;
  },

  getConversationRuns: async (conversationId: string): Promise<AgentRun[]> => {
    const res = await api.get<{ runs: AgentRun[] }>(`/conversations/${conversationId}/runs`);
    return res.data.runs;
  },

  approveRun: async (runId: string): Promise<{ patchText: string; reviewMd: string }> => {
    const res = await api.post<{ patchText: string; reviewMd: string }>(`/agent-runs/${runId}/approve`);
    return res.data;
  },

  getPatchDownloadUrl: (runId: string): string => {
    return `${API_URL}/agent-runs/${runId}/patch?download=true`;
  }
};
