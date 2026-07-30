import React, { useState, useEffect } from 'react';
import { FileText, X, PieChart, Layers, ArrowRight, FileCode } from 'lucide-react';
import type { RepositorySnapshot, RepositoryFileSummary } from '../types';
import { getFileClassification } from '../lib/treeUtils';

interface FileOverviewModalProps {
  snapshot: RepositorySnapshot | null;
  files: RepositoryFileSummary[];
  isOpen: boolean;
  onClose: () => void;
  initialClassification?: string | null;
  onSelectFile: (filePath: string) => void;
}

export const FileOverviewModal: React.FC<FileOverviewModalProps> = ({
  snapshot,
  files,
  isOpen,
  onClose,
  initialClassification,
  onSelectFile
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialClassification || 'all');
    }
  }, [isOpen, initialClassification]);

  if (!isOpen || !snapshot) return null;

  const normalizedFiles = files.map(f => ({
    ...f,
    classification: getFileClassification(f.path, f.classification)
  }));

  const total = normalizedFiles.length || 1;
  const languages = snapshot.languages || {};

  // Compute accurate layer counts using normalized classifications
  const layerCounts: Record<string, number> = {
    controller: normalizedFiles.filter(f => f.classification === 'controller').length,
    route: normalizedFiles.filter(f => f.classification === 'route').length,
    service: normalizedFiles.filter(f => f.classification === 'service').length,
    model: normalizedFiles.filter(f => f.classification === 'model').length,
    component: normalizedFiles.filter(f => f.classification === 'component').length,
  };

  const filteredFiles = activeTab === 'all'
    ? normalizedFiles
    : normalizedFiles.filter(f => f.classification.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header — Fixed Non-shrinking top header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22] shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                Repository File Architecture Inspector
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#38BDF8] border border-[#262B33]">
                  {filteredFiles.length} {activeTab !== 'all' ? activeTab.toUpperCase() : 'Total'} Files
                </span>
              </h3>
              <p className="text-xs text-[#8A8F97]">
                Deterministic file classification, languages, and line counts extracted without LLM calls.
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

        {/* Clean Layer Filter Tabs — Fixed Non-shrinking Bar */}
        <div className="px-6 border-b border-[#262B33] flex items-center gap-2 overflow-x-auto bg-[#181C22] shrink-0 z-10 py-1 custom-scrollbar">
          {[
            { id: 'all', label: `ALL (${total})` },
            { id: 'controller', label: `CONTROLLER (${layerCounts.controller})` },
            { id: 'route', label: `ROUTE (${layerCounts.route})` },
            { id: 'service', label: `SERVICE (${layerCounts.service})` },
            { id: 'model', label: `MODEL (${layerCounts.model})` },
            { id: 'component', label: `COMPONENT (${layerCounts.component})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#38BDF8] text-[#38BDF8] bg-[#12151A]'
                  : 'border-transparent text-[#8A8F97] hover:text-[#E4E1D6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-6 bg-[#12151A]">
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Languages Distribution */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-[#38BDF8]" /> Primary Languages
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(languages).map(([lang, count]) => (
                    <div key={lang} className="atlas-card p-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#E4E1D6] capitalize">{lang}</span>
                      <span className="font-mono text-[#38BDF8] font-bold">
                        {count} files ({Math.round((count / total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Classification Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#4A8B85]" /> Layer Breakdown
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(layerCounts).map(([type, count]) => (
                    <div
                      key={type}
                      onClick={() => setActiveTab(type)}
                      className="atlas-card p-2.5 hover:border-[#38BDF8] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-semibold text-[#E4E1D6] capitalize">{type}</span>
                      <span className="font-mono text-[#4A8B85] font-bold">{count} files</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Files List View */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" /> {activeTab.toUpperCase()} File List ({filteredFiles.length})
            </h4>
            <div className="space-y-1.5">
              {filteredFiles.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8A8F97] bg-[#181C22] rounded-xl border border-[#262B33]">
                  No files matching layer classification "{activeTab}".
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => {
                      onSelectFile(file.path);
                      onClose();
                    }}
                    className="atlas-card group p-3 hover:border-[#38BDF8] cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-4 h-4 text-[#38BDF8] shrink-0" />
                      <span className="font-mono text-[#E4E1D6] font-bold truncate">{file.path}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#12151A] text-[#8A8F97] uppercase font-bold border border-[#262B33]">
                        {file.classification}
                      </span>
                      <span className="text-xs text-[#8A8F97] font-mono">{file.lineCount}L</span>
                      <ArrowRight className="w-4 h-4 text-[#8A8F97] group-hover:text-[#38BDF8] transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
