import React from 'react';
import { Code2, X, ArrowRight, Zap } from 'lucide-react';
import type { RepositorySnapshot } from '../types';

interface SymbolRegistryModalProps {
  snapshot: RepositorySnapshot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SymbolRegistryModal: React.FC<SymbolRegistryModalProps> = ({
  snapshot,
  isOpen,
  onClose
}) => {
  if (!isOpen || !snapshot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                AST Symbol Registry
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#38BDF8] border border-[#262B33]">
                  {snapshot.symbolCount} Symbols Extracted
                </span>
              </h3>
              <p className="text-xs text-[#8A8F97]">
                Exported functions, controllers, services, and route handlers parsed directly via static AST.
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
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-3 bg-[#12151A]">
          <div className="p-4 rounded-xl bg-[#181C22] border border-[#262B33] text-xs text-[#E4E1D6] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#38BDF8]">
              <Zap className="w-4 h-4 text-[#38BDF8]" /> Static AST Analysis Complete
            </div>
            <p className="text-[#8A8F97] leading-relaxed">
              CodeAtlas extracted <strong>{snapshot.symbolCount}</strong> symbols across <strong>{snapshot.totalFiles}</strong> source files. Every symbol is indexed in local database tables for instant evidence lookup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
