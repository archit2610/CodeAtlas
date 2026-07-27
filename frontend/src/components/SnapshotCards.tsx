import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Code2,
  Route,
  Zap,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { RepositorySnapshot } from '../types';

interface SnapshotCardsProps {
  snapshot: RepositorySnapshot;
  onSelectPrompt: (prompt: string) => void;
  onOpenFilesModal?: () => void;
  onOpenSymbolsModal?: () => void;
  onOpenRoutesModal?: () => void;
  onOpenEdgesModal?: () => void;
}

export const SnapshotCards: React.FC<SnapshotCardsProps> = ({
  snapshot,
  onSelectPrompt,
  onOpenFilesModal,
  onOpenSymbolsModal,
  onOpenRoutesModal,
  onOpenEdgesModal
}) => {
  const suggestedPrompts = snapshot.suggestedPrompts ?? [
    "How does authentication work in this repository?",
    "Trace the main API request flow from entry point to database.",
    "Where are the database models and schemas defined?",
    "Why do users lose their session after checkout?"
  ];

  return (
    <div className="p-4 space-y-4 bg-[#181C22] border-b border-[#262B33]">
      {/* Overview Stat Cards Grid — ALL 4 CARDS CLICKABLE & INTERACTIVE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Total Files */}
        <div
          onClick={onOpenFilesModal}
          className="atlas-card p-3 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
          title="Click to view file architecture breakdown"
        >
          <div>
            <span className="text-[11px] font-medium text-[#8A8F97]">Total Files</span>
            <div className="text-xl font-extrabold text-[#E4E1D6]">{snapshot.totalFiles}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Extracted Symbols */}
        <div
          onClick={onOpenSymbolsModal}
          className="atlas-card p-3 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
          title="Click to view AST symbol registry"
        >
          <div>
            <span className="text-[11px] font-medium text-[#8A8F97]">Extracted Symbols</span>
            <div className="text-xl font-extrabold text-[#E4E1D6]">{snapshot.symbolCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <Code2 className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Detected Routes */}
        <div
          onClick={onOpenRoutesModal}
          className="atlas-card p-3 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
          title="Click to view API route map inspector"
        >
          <div>
            <span className="text-[11px] font-medium text-[#8A8F97]">Detected Routes</span>
            <div className="text-xl font-extrabold text-[#4A8B85]">{snapshot.routeFiles?.length ?? 0}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#4A8B85]">
            <Route className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Graph Edges */}
        <div
          onClick={onOpenEdgesModal}
          className="atlas-card p-3 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
          title="Click to view dependency graph edges"
        >
          <div>
            <span className="text-[11px] font-medium text-[#8A8F97]">Graph Edges</span>
            <div className="text-xl font-extrabold text-[#38BDF8]">{snapshot.dependencyEdgeCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Detected Framework Badges */}
      {snapshot.frameworks && snapshot.frameworks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#8A8F97] font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" /> Stack:
          </span>
          {snapshot.frameworks.map((fw) => (
            <span
              key={fw}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#12151A] text-[#38BDF8] border border-[#262B33]"
            >
              {fw}
            </span>
          ))}
        </div>
      )}

      {/* 1-Click Suggested Architectural Question Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            Suggested Architectural Questions
          </span>
          <span className="text-[11px] text-[#8A8F97]">Click to ask CodeAtlas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPrompt(prompt)}
              className="atlas-card group text-left p-3 text-xs text-[#E4E1D6] transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-2 pr-2">
                <HelpCircle className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{prompt}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8A8F97] group-hover:text-[#38BDF8] shrink-0 mt-0.5 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
