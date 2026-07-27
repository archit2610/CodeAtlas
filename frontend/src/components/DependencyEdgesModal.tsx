import React, { useState, useEffect } from 'react';
import { Network, X, GitCommit, FileCode, ArrowRight, Loader2 } from 'lucide-react';
import type { RepositorySnapshot } from '../types';
import { repositoryApi, type GraphData } from '../lib/repositoryApi';

interface DependencyEdgesModalProps {
  repositoryId: string | null;
  snapshot: RepositorySnapshot | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectFile?: (filePath: string) => void;
}

export const DependencyEdgesModal: React.FC<DependencyEdgesModalProps> = ({
  repositoryId,
  snapshot,
  isOpen,
  onClose,
  onSelectFile
}) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && repositoryId) {
      loadGraph();
    }
  }, [isOpen, repositoryId]);

  const loadGraph = async () => {
    if (!repositoryId) return;
    try {
      setIsLoading(true);
      const data = await repositoryApi.getGraph(repositoryId);
      setGraphData(data);
    } catch (e) {
      console.error('Failed to load dependency graph:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !snapshot) return null;

  const getNodeColor = (classification: string) => {
    switch (classification) {
      case 'controller':
        return '#38BDF8';
      case 'route':
        return '#4A8B85';
      case 'service':
        return '#818CF8';
      case 'model':
        return '#7C9473';
      default:
        return '#8A8F97';
    }
  };

  const edges = graphData?.edges || [];
  const nodes = graphData?.nodes || [];

  const connectedEdges = selectedNode
    ? edges.filter(e => e.source === selectedNode || e.target === selectedNode)
    : edges;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                Interactive Dependency Graph Visualizer
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#38BDF8] border border-[#262B33]">
                  {snapshot.dependencyEdgeCount} Import Edges
                </span>
              </h3>
              <p className="text-xs text-[#8A8F97]">
                Visualizing deterministic import graph relationships across your repository files.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8F97] hover:text-[#E4E1D6] hover:bg-[#1E232B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 bg-[#12151A]">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-[#38BDF8] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">Generating Dependency Graph...</span>
            </div>
          ) : (
            <>
              {/* Interactive Legend & Filter */}
              <div className="flex items-center justify-between gap-4 flex-wrap bg-[#181C22] p-3 rounded-xl border border-[#262B33] text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#8A8F97] font-semibold">Node Layers:</span>
                  <span className="flex items-center gap-1.5 font-mono text-[#38BDF8]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span> Controller
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[#4A8B85]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4A8B85]"></span> Route
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[#818CF8]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]"></span> Service
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[#7C9473]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C9473]"></span> Model
                  </span>
                </div>

                {selectedNode && (
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-[11px] text-[#38BDF8] hover:underline font-mono"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Node List & Connections View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* File Nodes Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" /> Repository Module Nodes ({nodes.length})
                  </h4>
                  <div className="max-h-80 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {nodes.map((node) => {
                      const isSelected = selectedNode === node.id;
                      const color = getNodeColor(node.classification);

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node.id)}
                          className={`atlas-card p-2.5 cursor-pointer flex items-center justify-between text-xs transition-all ${
                            isSelected ? 'border-[#38BDF8] bg-[#232933]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="font-mono text-[#E4E1D6] truncate">{node.id}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-[#12151A] text-[#8A8F97] uppercase font-bold border border-[#262B33]">
                              {node.classification}
                            </span>
                            {onSelectFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectFile(node.id);
                                  onClose();
                                }}
                                className="text-[#38BDF8] hover:underline flex items-center gap-0.5"
                              >
                                View <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Import Graph Relationships */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A8B85] flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-[#4A8B85]" /> Import Edges ({connectedEdges.length})
                  </h4>
                  <div className="max-h-80 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {connectedEdges.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#181C22] border border-[#262B33] text-xs text-[#8A8F97] text-center">
                        Select a node to inspect its incoming and outgoing dependency edges.
                      </div>
                    ) : (
                      connectedEdges.map((edge, idx) => (
                        <div
                          key={idx}
                          className="atlas-card p-2.5 flex items-center justify-between text-[11px] font-mono"
                        >
                          <span className="text-[#38BDF8] truncate max-w-[42%]">{edge.source}</span>
                          <span className="text-[#8A8F97] text-[10px] shrink-0 flex items-center gap-1">
                            L{edge.sourceLine} <ArrowRight className="w-3 h-3 text-[#4A8B85]" />
                          </span>
                          <span className="text-[#4A8B85] truncate max-w-[42%] text-right">{edge.target}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
