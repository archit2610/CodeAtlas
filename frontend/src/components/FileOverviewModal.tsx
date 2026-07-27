import React from 'react';
import { FileText, X, PieChart, Layers, ArrowRight } from 'lucide-react';
import type { RepositorySnapshot } from '../types';

interface FileOverviewModalProps {
  snapshot: RepositorySnapshot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FileOverviewModal: React.FC<FileOverviewModalProps> = ({
  snapshot,
  isOpen,
  onClose
}) => {
  if (!isOpen || !snapshot) return null;

  const total = snapshot.totalFiles || 1;
  const languages = snapshot.languages || {};
  const classifications = snapshot.classifications || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                Repository File Architecture
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#38BDF8] border border-[#262B33]">
                  {snapshot.totalFiles} Files
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 bg-[#12151A]">
          {/* Languages Distribution */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#38BDF8]" /> Primary Programming Languages
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(languages).map(([lang, count]) => (
                <div key={lang} className="atlas-card p-3 flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#E4E1D6] capitalize">{lang}</span>
                  <span className="text-xs font-mono text-[#38BDF8] font-bold">
                    {count} files ({Math.round((count / total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Module Classification Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4A8B85]" /> Module Classification Layers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(classifications).map(([type, count]) => (
                <div key={type} className="atlas-card p-3 flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#E4E1D6] capitalize">{type}</span>
                  <span className="text-xs font-mono text-[#4A8B85] font-bold">{count} files</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
