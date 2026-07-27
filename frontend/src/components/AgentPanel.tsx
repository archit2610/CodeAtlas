import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  FileCode,
  ShieldAlert,
  GitPullRequest,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CitationMarkdown } from './CitationMarkdown';
import type { AgentRun } from '../types';

interface AgentPanelProps {
  currentRun: AgentRun | null;
  streamingStage: string | null;
  streamingIntent: string | null;
  streamingAnswer: string;
  isStreaming: boolean;
  rateLimitInfo: { message: string; countdownSeconds: number } | null;
  onSubmitRequest: (request: string) => void;
  onApprovePlan: (runId: string) => void;
  onSelectCitation: (path: string, startLine: number, endLine: number) => void;
  isApproving: boolean;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  currentRun,
  streamingStage,
  streamingIntent,
  streamingAnswer,
  isStreaming,
  rateLimitInfo,
  onSubmitRequest,
  onApprovePlan,
  onSelectCitation,
  isApproving
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isStreaming) {
      onSubmitRequest(inputText.trim());
      setInputText('');
    }
  };

  const getRiskBadgeClass = (risk?: string) => {
    switch (risk) {
      case 'high':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default:
        return 'bg-[#7C9473]/20 text-[#7C9473] border-[#7C9473]/50';
    }
  };

  const activeAnswerText = streamingAnswer || currentRun?.answerMd || '';

  return (
    <div className="h-full flex flex-col bg-[#181C22] border-l border-[#262B33] text-[#E4E1D6]">
      {/* Panel Header */}
      <div className="h-11 px-4 border-b border-[#262B33] bg-[#12151A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#C79A4B]" />
          <span className="text-xs font-bold text-[#E4E1D6] uppercase tracking-wider">
            CodeAtlas Assistant
          </span>
        </div>
        {streamingIntent && (
          <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#C79A4B] border border-[#262B33]">
            Intent: {streamingIntent}
          </span>
        )}
      </div>

      {/* Main Conversation & Activity Body */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-[#181C22]">
        {/* Welcome Empty State */}
        {!currentRun && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A8F97] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#C79A4B] shadow-lg">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#E4E1D6]">Ask CodeAtlas Intelligence</h4>
              <p className="text-xs text-[#8A8F97] max-w-xs mt-1">
                Ask architectural questions, debug issues, trace request flows, or request approval-gated code changes.
              </p>
            </div>
          </div>
        )}

        {/* User Request Bubble */}
        {currentRun?.request && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#C79A4B] flex items-center justify-center text-[#12151A] shrink-0 mt-0.5 shadow-md font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-[#1E232B] border border-[#262B33] text-xs text-[#E4E1D6] max-w-[88%] shadow-sm leading-relaxed">
              {currentRun.request}
            </div>
          </div>
        )}

        {/* Live SSE Stage Activity Log */}
        <AnimatePresence>
          {isStreaming && streamingStage && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 rounded-xl bg-[#12151A] border border-[#262B33] flex items-center gap-3 shadow-md"
            >
              <Loader2 className="w-4 h-4 text-[#C79A4B] animate-spin shrink-0" />
              <span className="text-xs text-[#E4E1D6] font-medium">{streamingStage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rate Limit Human-Readable Countdown Card */}
        {rateLimitInfo && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Gemini Rate Limit Exceeded</span>
            </div>
            <p className="text-slate-300">{rateLimitInfo.message}</p>
            <div className="text-[11px] font-semibold text-amber-400">
              Auto-resuming in {rateLimitInfo.countdownSeconds}s...
            </div>
          </div>
        )}

        {/* Evidence Citations */}
        {currentRun?.evidenceJson && currentRun.evidenceJson.length > 0 && (
          <div className="atlas-card p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-[#8A8F97] uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#4A8B85]" /> Grounded Evidence ({currentRun.evidenceJson.length} files)
            </div>
            <div className="space-y-1.5">
              {currentRun.evidenceJson.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectCitation(ev.path, ev.startLine, ev.endLine)}
                  className="group p-2 rounded-lg bg-[#12151A] hover:bg-[#232933] border border-[#262B33] hover:border-[#4A8B85] cursor-pointer flex items-center justify-between text-xs transition-all"
                >
                  <span className="font-mono text-[#4A8B85] font-medium truncate">
                    {ev.path}:L{ev.startLine}-L{ev.endLine}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8A8F97] group-hover:text-[#4A8B85] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Request Approval Card */}
        {currentRun?.planJson && (
          <div className="atlas-card p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C79A4B] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#C79A4B]" /> Structured Change Plan
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getRiskBadgeClass(currentRun.planJson.riskLevel)}`}>
                Risk: {currentRun.planJson.riskLevel}
              </span>
            </div>

            <p className="text-xs text-[#E4E1D6]/90 leading-relaxed">
              {currentRun.planJson.summary}
            </p>

            {/* Affected Files List */}
            <div className="space-y-1 text-xs">
              <span className="text-[11px] text-[#8A8F97] font-semibold">Affected Target Files:</span>
              {currentRun.planJson.affectedFiles.map((f, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#E4E1D6]">{f.path}</span>
                  <span className="text-[#4A8B85] uppercase text-[10px] font-bold">{f.action}</span>
                </div>
              ))}
            </div>

            {/* Approve Button */}
            {currentRun.status === 'planning' && (
              <button
                onClick={() => onApprovePlan(currentRun.id)}
                disabled={isApproving}
                className="atlas-btn-primary w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#12151A]" />
                    <span>Generating Unified Patch Diff...</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest className="w-4 h-4 text-[#12151A]" />
                    <span>Approve Plan & Generate Patch</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Answer Streaming & Completed Response Markdown with 100% Clickable File Citation Links */}
        {activeAnswerText && (
          <div className="atlas-card p-4 text-xs text-[#E4E1D6] leading-relaxed shadow-lg space-y-2">
            <CitationMarkdown
              content={activeAnswerText}
              onSelectCitation={onSelectCitation}
            />
          </div>
        )}
      </div>

      {/* Input Footer Form */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-[#262B33] bg-[#12151A]">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask a question or request a safe code change..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isStreaming}
            className="w-full bg-[#181C22] border border-[#262B33] rounded-xl pl-4 pr-11 py-2.5 text-xs text-[#E4E1D6] placeholder-[#8A8F97]/60 focus:outline-none focus:border-[#C79A4B] focus:ring-1 focus:ring-[#C79A4B] transition-all disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputText.trim()}
            className="atlas-btn-primary absolute right-2 p-1.5 rounded-lg disabled:opacity-40 transition-all shadow-md"
          >
            <Send className="w-3.5 h-3.5 text-[#12151A]" />
          </button>
        </div>
      </form>
    </div>
  );
};
