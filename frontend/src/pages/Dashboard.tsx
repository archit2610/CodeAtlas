import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { SnapshotCards } from '../components/SnapshotCards';
import { FileTree } from '../components/FileTree';
import { SourceViewer } from '../components/SourceViewer';
import { AgentPanel } from '../components/AgentPanel';
import { Footer } from '../components/Footer';
import { RouteInspectorModal } from '../components/RouteInspectorModal';
import { ImpactInspectorModal } from '../components/ImpactInspectorModal';
import { FileOverviewModal } from '../components/FileOverviewModal';
import { SymbolRegistryModal } from '../components/SymbolRegistryModal';
import { DependencyEdgesModal } from '../components/DependencyEdgesModal';
import { EndToEndRouteTracerModal } from '../components/EndToEndRouteTracerModal';

import { repositoryApi } from '../lib/repositoryApi';
import { API_URL } from '../lib/constants';
import type {
  Repository,
  RepositoryFileSummary,
  RepositoryFileDetail,
  AgentRun,
  BlastRadiusResult,
  RouteInspectionResult
} from '../types';

export const Dashboard: React.FC = () => {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [fileSummaries, setFileSummaries] = useState<RepositoryFileSummary[]>([]);
  const [activeFile, setActiveFile] = useState<RepositoryFileDetail | null>(null);
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null);

  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [streamingStage, setStreamingStage] = useState<string | null>(null);
  const [streamingIntent, setStreamingIntent] = useState<string | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ message: string; countdownSeconds: number } | null>(null);

  const [activePatchText, setActivePatchText] = useState<string | null>(null);
  const [activeReviewMd, setActiveReviewMd] = useState<string | null>(null);

  // Modals & Layer Filter tab for all stat cards
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeClassificationTab, setActiveClassificationTab] = useState<string | null>(null);
  const [isSymbolsModalOpen, setIsSymbolsModalOpen] = useState(false);
  const [isEdgesModalOpen, setIsEdgesModalOpen] = useState(false);

  const [routeMap, setRouteMap] = useState<RouteInspectionResult | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  // End-to-End Route Flow Tracer Modal state
  const [isRouteTracerOpen, setIsRouteTracerOpen] = useState(false);
  const [selectedTracePath, setSelectedTracePath] = useState<string | null>(null);

  const [impactResult, setImpactResult] = useState<BlastRadiusResult | null>(null);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);

  // Resizable Panel Widths
  const [leftWidth, setLeftWidth] = useState(360);
  const [rightWidth, setRightWidth] = useState(440);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  // Load persistent active repository and visitor session on mount
  useEffect(() => {
    restoreVisitorSession();
  }, []);

  // Handle panel resizing via mouse drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        const newWidth = Math.min(Math.max(240, e.clientX), 550);
        setLeftWidth(newWidth);
      } else if (isDraggingRight.current) {
        const newWidth = Math.min(Math.max(280, window.innerWidth - e.clientX), 700);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const restoreVisitorSession = async () => {
    try {
      setIsImporting(true);
      const savedRepoId = localStorage.getItem('codeatlas_active_repo_id');

      if (savedRepoId) {
        try {
          const savedRepo = await repositoryApi.getRepository(savedRepoId);
          if (savedRepo && savedRepo.status === 'ready') {
            setRepository(savedRepo);
            await loadTree(savedRepo.id);

            const convos = await repositoryApi.getConversations();
            if (convos && convos.length > 0) {
              const latestConvo = convos[0];
              const runs = await repositoryApi.getConversationRuns(latestConvo.id);
              if (runs && runs.length > 0) {
                const latestRun = runs[runs.length - 1];
                if (latestRun.repositoryId === savedRepo.id) {
                  setCurrentRun(latestRun);
                  if (latestRun.patchText) setActivePatchText(latestRun.patchText);
                  if (latestRun.reviewMd) setActiveReviewMd(latestRun.reviewMd);
                }
              }
            }
            return;
          }
        } catch (e) {
          console.warn('Could not restore saved repo from localStorage:', e);
        }
      }

      await loadDemoRepository();
    } catch (error) {
      console.warn('Could not restore visitor session, loading demo repo:', error);
      await loadDemoRepository();
    } finally {
      setIsImporting(false);
    }
  };

  const loadDemoRepository = async () => {
    try {
      setIsImporting(true);
      const repo = await repositoryApi.importDemo();
      setRepository(repo);
      localStorage.setItem('codeatlas_active_repo_id', repo.id);
      await loadTree(repo.id);
    } catch (error) {
      console.error('Failed to load demo repository:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const loadGithubRepository = async (url: string) => {
    try {
      setIsImporting(true);
      const repo = await repositoryApi.importGithub(url);
      setRepository(repo);
      localStorage.setItem('codeatlas_active_repo_id', repo.id);
      setCurrentRun(null);
      setStreamingAnswer('');
      setActivePatchText(null);
      setActiveReviewMd(null);
      await loadTree(repo.id);
    } catch (error) {
      alert(`Import error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const loadTree = async (repoId: string) => {
    const files = await repositoryApi.getTree(repoId);
    setFileSummaries(files);

    const entryFile = files.find(f => f.classification === 'controller' || f.classification === 'route') || files[0];
    if (entryFile) {
      selectFile(repoId, entryFile.path);
    }
  };

  const selectFile = async (repoId: string, filePath: string, startLine?: number, endLine?: number) => {
    try {
      const fileData = await repositoryApi.getFile(repoId, filePath);
      setActiveFile(fileData);

      if (startLine && endLine) {
        setHighlightRange({ start: startLine, end: endLine });
        setTimeout(() => {
          const el = document.getElementById(`line-${startLine}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        setHighlightRange(null);
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    }
  };

  const handleOpenRoutes = async () => {
    if (!repository) return;
    try {
      const mapData = await repositoryApi.getRoutes(repository.id);
      setRouteMap(mapData);
      setIsRouteModalOpen(true);
    } catch (error) {
      console.error('Failed to inspect routes:', error);
    }
  };

  const handleTraceRoute = async (routePath: string) => {
    if (!repository) return;
    try {
      const mapData = await repositoryApi.getRoutes(repository.id);
      setRouteMap(mapData);
      setSelectedTracePath(routePath);
      setIsRouteTracerOpen(true);
    } catch (error) {
      console.error('Failed to trace route:', error);
    }
  };

  const handleOpenClassificationModal = (classification: string) => {
    setActiveClassificationTab(classification);
    setIsFilesModalOpen(true);
  };

  const handleInspectImpact = async (filePath: string) => {
    if (!repository) return;
    try {
      const impactData = await repositoryApi.getImpact(repository.id, filePath);
      setImpactResult(impactData);
      setIsImpactModalOpen(true);
    } catch (error) {
      console.error('Failed to calculate impact:', error);
    }
  };

  const handleRunAgent = async (requestText: string) => {
    if (!repository) return;

    setIsStreaming(true);
    setStreamingStage('Initiating CodeAtlas request...');
    setStreamingAnswer('');
    setRateLimitInfo(null);
    setActivePatchText(null);
    setActiveReviewMd(null);

    try {
      const response = await fetch(`${API_URL}/repositories/${repository.id}/agent-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ request: requestText }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'stage') {
                setStreamingStage(event.label);
              } else if (event.type === 'intent') {
                setStreamingIntent(event.intent);
              } else if (event.type === 'token') {
                setStreamingAnswer(prev => prev + (event.token || event.data || ''));
              } else if (event.type === 'plan') {
                setCurrentRun(prev => prev ? { ...prev, planJson: event.plan, status: 'planning' } : null);
              } else if (event.type === 'complete') {
                setCurrentRun(event.result);
              } else if (event.type === 'error') {
                if (event.errorType === 'RATE_LIMIT_EXCEEDED' || event.errorType === 'QUOTA_EXHAUSTED') {
                  setRateLimitInfo({
                    message: event.message || 'Gemini API limit reached',
                    countdownSeconds: event.retryAfterSeconds || 15
                  });
                }
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Agent run SSE error:', error);
    } finally {
      setIsStreaming(false);
      setStreamingStage(null);
    }
  };

  const handleApprovePlan = async (runId: string) => {
    try {
      setIsApproving(true);
      const patchData = await repositoryApi.approveRun(runId);
      setActivePatchText(patchData.patchText);
      setActiveReviewMd(patchData.reviewMd);
      setCurrentRun(prev => prev ? { ...prev, status: 'completed', patchText: patchData.patchText, reviewMd: patchData.reviewMd } : null);
    } catch (error) {
      alert(`Approval error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#12151A] text-[#E4E1D6] overflow-hidden select-none">
      {/* Navigation Top Bar */}
      <Navbar
        activeRepository={repository}
        onImportDemo={loadDemoRepository}
        onImportGithub={loadGithubRepository}
        isImporting={isImporting}
      />

      {/* Main Explorer 3-Panel Resizable Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Explorer & Snapshot */}
        <div style={{ width: `${leftWidth}px` }} className="flex flex-col shrink-0 overflow-hidden">
          {repository?.snapshotJson && (
            <SnapshotCards
              snapshot={repository.snapshotJson}
              files={fileSummaries}
              onSelectPrompt={handleRunAgent}
              onOpenClassificationModal={handleOpenClassificationModal}
              onOpenSymbolsModal={() => setIsSymbolsModalOpen(true)}
              onOpenRoutesModal={handleOpenRoutes}
              onOpenEdgesModal={() => setIsEdgesModalOpen(true)}
            />
          )}

          <div className="flex-1 overflow-hidden">
            <FileTree
              files={fileSummaries}
              activeFilePath={activeFile?.path || null}
              onSelectFile={(path) => repository && selectFile(repository.id, path)}
              onInspectImpact={handleInspectImpact}
            />
          </div>
        </div>

        {/* Resizable Handle 1 (Left <-> Center) */}
        <div
          onMouseDown={() => {
            isDraggingLeft.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          className="w-1.5 hover:w-2 bg-[#181C22] hover:bg-[#38BDF8] cursor-col-resize shrink-0 transition-all z-20 group flex items-center justify-center"
          title="Drag to resize panel"
        >
          <div className="w-0.5 h-8 bg-[#262B33] group-hover:bg-[#38BDF8] rounded-full transition-colors"></div>
        </div>

        {/* Center Panel: Source Viewer & Diff Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SourceViewer
            file={activeFile}
            highlightRange={highlightRange}
            activePatchText={activePatchText}
            activeReviewMd={activeReviewMd}
            activeRunId={currentRun?.id || null}
            onInspectImpact={handleInspectImpact}
          />
        </div>

        {/* Resizable Handle 2 (Center <-> Right) */}
        <div
          onMouseDown={() => {
            isDraggingRight.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          className="w-1.5 hover:w-2 bg-[#181C22] hover:bg-[#38BDF8] cursor-col-resize shrink-0 transition-all z-20 group flex items-center justify-center"
          title="Drag to resize panel"
        >
          <div className="w-0.5 h-8 bg-[#262B33] group-hover:bg-[#38BDF8] rounded-full transition-colors"></div>
        </div>

        {/* Right Panel: CodeAtlas Assistant & Activity Stream */}
        <div style={{ width: `${rightWidth}px` }} className="flex flex-col shrink-0 overflow-hidden">
          <AgentPanel
            currentRun={currentRun}
            streamingStage={streamingStage}
            streamingIntent={streamingIntent}
            streamingAnswer={streamingAnswer}
            isStreaming={isStreaming}
            rateLimitInfo={rateLimitInfo}
            onSubmitRequest={handleRunAgent}
            onApprovePlan={handleApprovePlan}
            onSelectCitation={(path, start, end) => repository && selectFile(repository.id, path, start, end)}
            isApproving={isApproving}
          />
        </div>
      </div>

      {/* Sleek Footer */}
      <Footer
        totalFiles={fileSummaries.length}
        extractedSymbols={repository?.snapshotJson?.symbolCount ?? 0}
      />

      {/* ALL STAT CARD INTERACTIVE MODALS */}
      <FileOverviewModal
        snapshot={repository?.snapshotJson || null}
        files={fileSummaries}
        isOpen={isFilesModalOpen}
        onClose={() => setIsFilesModalOpen(false)}
        initialClassification={activeClassificationTab}
        onSelectFile={(path) => repository && selectFile(repository.id, path)}
      />

      <SymbolRegistryModal
        snapshot={repository?.snapshotJson || null}
        isOpen={isSymbolsModalOpen}
        onClose={() => setIsSymbolsModalOpen(false)}
      />

      <RouteInspectorModal
        routeMap={routeMap}
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onSelectRoute={(path, line) => repository && selectFile(repository.id, path, line, line)}
        onTraceRoute={handleTraceRoute}
      />

      <EndToEndRouteTracerModal
        repositoryId={repository?.id || null}
        routeMap={routeMap}
        initialRoutePath={selectedTracePath}
        isOpen={isRouteTracerOpen}
        onClose={() => setIsRouteTracerOpen(false)}
        onSelectCodeLocation={(path, line) => repository && selectFile(repository.id, path, line, line)}
      />

      <DependencyEdgesModal
        repositoryId={repository?.id || null}
        snapshot={repository?.snapshotJson || null}
        files={fileSummaries}
        isOpen={isEdgesModalOpen}
        onClose={() => setIsEdgesModalOpen(false)}
        onSelectFile={(path) => repository && selectFile(repository.id, path)}
      />

      <ImpactInspectorModal
        impact={impactResult}
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        onSelectFile={(path) => repository && selectFile(repository.id, path)}
      />
    </div>
  );
};
