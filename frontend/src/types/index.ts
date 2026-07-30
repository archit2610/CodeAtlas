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
  content: string;
  contentHash: string;
  symbolsJson?: SourceSymbol[];
  importsJson?: SourceImport[];
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

export interface RouteTraceStep {
  stepIndex: number;
  layer: 'route' | 'controller' | 'service' | 'model';
  title: string;
  filePath: string;
  line: number;
  symbolName?: string;
  codeSnippet: string;
}

export interface RouteTraceResult {
  method: string;
  routePath: string;
  steps: RouteTraceStep[];
}

export interface BlastRadiusDependent {
  fromPath: string;
  sourceLine: number;
  edgeType: string;
}

export interface BlastRadiusResult {
  filePath: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  directDependents: BlastRadiusDependent[];
  affectedRoutes: string[];
}

export interface AgentRunPlan {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  affectedFiles: Array<{ path: string; action: 'modify' | 'create' | 'delete' }>;
}

export interface AgentRun {
  id: string;
  repositoryId: string;
  conversationId: string;
  intent: 'explain' | 'trace' | 'debug' | 'impact' | 'change_request';
  request: string;
  answerMd?: string;
  evidenceJson?: Array<{ path: string; startLine: number; endLine: number }>;
  planJson?: AgentRunPlan;
  patchText?: string;
  reviewMd?: string;
  status: 'routing' | 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
