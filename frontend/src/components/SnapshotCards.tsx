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
  ArrowRight,
  Cpu,
  Server,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { RepositorySnapshot, RepositoryFileSummary } from '../types';
import { getFileClassification } from '../lib/treeUtils';

interface SnapshotCardsProps {
  snapshot: RepositorySnapshot;
  files: RepositoryFileSummary[];
  onSelectPrompt: (prompt: string) => void;
  onOpenClassificationModal?: (classification: string) => void;
  onOpenSymbolsModal?: () => void;
  onOpenRoutesModal?: () => void;
  onOpenEdgesModal?: () => void;
}

export const SnapshotCards: React.FC<SnapshotCardsProps> = ({
  snapshot,
  files,
  onSelectPrompt,
  onOpenClassificationModal,
  onOpenSymbolsModal,
  onOpenRoutesModal,
  onOpenEdgesModal
}) => {
  const suggestedPrompts = snapshot.suggestedPrompts ?? [
    "How does authentication work in this repository?",
    "Trace the main API request flow from entry point to database.",
    "Where are the database models and schemas defined?",
    "Why do users lose their session after checkout?",
    "What external services or API integrations are configured?",
    "Show me how errors and exceptions are handled in routes."
  ];

  const normalizedFiles = files.map(f => ({
    ...f,
    classification: getFileClassification(f.path, f.classification)
  }));

  const controllerCount = normalizedFiles.filter(f => f.classification === 'controller').length;
  const routeCount = normalizedFiles.filter(f => f.classification === 'route').length;
  const serviceCount = normalizedFiles.filter(f => f.classification === 'service').length;
  const modelCount = normalizedFiles.filter(f => f.classification === 'model').length;

  const statCardsRef = React.useRef<HTMLDivElement>(null);
  const questionsRef = React.useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-3 space-y-3 bg-[#181C22] border-b border-[#262B33] select-none">
      {/* Stat Cards Header with Left/Right Scroll Controls */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#38BDF8]" /> Repository Intelligence Overview
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollContainer(statCardsRef, 'left')}
            className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#E4E1D6] transition-colors border border-[#262B33]"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollContainer(statCardsRef, 'right')}
            className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#E4E1D6] transition-colors border border-[#262B33]"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stat Cards Carousel: Total Files -> Symbols -> Controllers -> Routes -> Services -> Graph Edges -> Models */}
      <div
        ref={statCardsRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar snap-x snap-mandatory"
      >
        {/* 1. Total Files */}
        <div
          onClick={() => onOpenClassificationModal?.('all')}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view file architecture breakdown"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Total Files</span>
            <div className="text-lg font-extrabold text-[#E4E1D6]">{snapshot.totalFiles}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 2. Symbols */}
        <div
          onClick={onOpenSymbolsModal}
          className="atlas-card min-w-[135px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view AST symbol registry"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Symbols</span>
            <div className="text-lg font-extrabold text-[#E4E1D6]">{snapshot.symbolCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <Code2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 3. Controllers */}
        <div
          onClick={() => onOpenClassificationModal?.('controller')}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view controller files"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Controllers</span>
            <div className="text-lg font-extrabold text-[#E4E1D6]">{controllerCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <Cpu className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4. Routes */}
        <div
          onClick={onOpenRoutesModal}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view API route map inspector"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Routes</span>
            <div className="text-lg font-extrabold text-[#4A8B85]">{routeCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#4A8B85]">
            <Route className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 5. Services */}
        <div
          onClick={() => onOpenClassificationModal?.('service')}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view service files"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Services</span>
            <div className="text-lg font-extrabold text-[#E4E1D6]">{serviceCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#4A8B85]">
            <Server className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 6. Graph Edges */}
        <div
          onClick={onOpenEdgesModal}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view dependency graph edges"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Graph Edges</span>
            <div className="text-lg font-extrabold text-[#38BDF8]">{snapshot.dependencyEdgeCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 7. Models */}
        <div
          onClick={() => onOpenClassificationModal?.('model')}
          className="atlas-card min-w-[130px] p-2.5 hover:border-[#38BDF8] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] snap-start shrink-0"
          title="Click to view model files"
        >
          <div>
            <span className="text-[10px] font-medium text-[#8A8F97]">Models</span>
            <div className="text-lg font-extrabold text-[#E4E1D6]">{modelCount}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center text-[#7C9473]">
            <Database className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Suggested Questions Section Header */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> Suggested Questions
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollContainer(questionsRef, 'left')}
            className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#E4E1D6] transition-colors border border-[#262B33]"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollContainer(questionsRef, 'right')}
            className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#E4E1D6] transition-colors border border-[#262B33]"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Sliding Suggested Questions Carousel */}
      <div
        ref={questionsRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar snap-x snap-mandatory"
      >
        {suggestedPrompts.map((prompt, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectPrompt(prompt)}
            className="atlas-card group min-w-[240px] max-w-[260px] p-2.5 text-xs text-[#E4E1D6] transition-all flex items-start justify-between snap-start shrink-0"
          >
            <div className="flex items-start gap-2 pr-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-snug text-[11px]">{prompt}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#8A8F97] group-hover:text-[#38BDF8] shrink-0 mt-0.5 transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
