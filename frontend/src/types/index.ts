export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  anonymousVisitorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepositorySnapshot {
  totalFiles: number;
  textFiles: number;
  languages: Record<string, number>;
  classifications: Record<string, number>;
  frameworks: string[];
  entryPoints: string[];
  routeFiles: string[];
  modelFiles: string[];
  controllerFiles: string[];
  serviceFiles: string[];
  componentFiles: string[];
  symbolCount: number;
  dependencyEdgeCount: number;
  suggestedPrompts?: string[];
}

export interface Repository {
  id: string;
  visitorId: string;
  sourceType: 'demo' | 'github_public';
  sourceUrl: string;
  owner?: string;
  name: string;
  status: 'pending' | 'importing' | 'ready' | 'error';
  languages: Record<string, number>;
  frameworks: string[];
  snapshotJson: RepositorySnapshot;
  errorMessage?: string;
  createdAt: string;
}

export interface RepositoryFileSummary {
  path: string;
  language: string;
  classification: string;
  lineCount: number;
}

export interface SourceSymbol {
  name: string;
  kind: string;
  line: number;
}

export interface SourceImport {
  target: string;
  line: number;
  raw: string;
}

export interface RepositoryFileDetail extends RepositoryFileSummary {
  id: string;
  repositoryId: string;
  content: string;
  contentHash: string;
  symbolsJson: SourceSymbol[];
  importsJson: SourceImport[];
  createdAt: string;
}

export interface EvidenceCitation {
  path: string;
  startLine: number;
  endLine: number;
  claim?: string;
  confidence?: string;
}

export interface ChangePlan {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  affectedFiles: Array<{
    path: string;
    reason: string;
    action: 'modify' | 'add' | 'delete';
  }>;
  assumptions: string[];
  unresolvedQuestions: string[];
}

export interface AgentRun {
  id: string;
  repositoryId: string;
  visitorId: string;
  conversationId?: string | null;
  request: string;
  intent: 'explain' | 'trace' | 'debug' | 'impact' | 'change_request';
  status: 'pending' | 'running' | 'planning' | 'approved' | 'completed' | 'error';
  evidenceJson: EvidenceCitation[];
  planJson?: ChangePlan | null;
  answerMd?: string | null;
  patchText?: string | null;
  reviewMd?: string | null;
  tokensUsed?: number;
  costUsd?: number;
  errorMessage?: string | null;
  createdAt: string;
}

export interface BlastRadiusResult {
  filePath: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  directDependents: Array<{ fromPath: string; sourceLine: number; edgeType: string }>;
  transitiveDependents: string[];
  affectedRoutes: string[];
  summary: string;
}

export interface RouteEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'USE' | 'ALL';
  routePath: string;
  filePath: string;
  line: number;
  handlerSymbol?: string;
}

export interface RouteInspectionResult {
  totalRoutes: number;
  routeFilesCount: number;
  routes: RouteEndpoint[];
}
