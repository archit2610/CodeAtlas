import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Compass,
  FileCheck2,
  GitPullRequest,
  ChevronRight,
  Code2
} from 'lucide-react';
import type { RepositoryFileDetail } from '../types';
import { repositoryApi } from '../lib/repositoryApi';

interface SourceViewerProps {
  file: RepositoryFileDetail | null;
  highlightRange: { start: number; end: number } | null;
  activePatchText: string | null;
  activeReviewMd: string | null;
  activeRunId: string | null;
  onInspectImpact?: (path: string) => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  file,
  highlightRange,
  activePatchText,
  activeReviewMd,
  activeRunId,
  onInspectImpact
}) => {
  const [activeTab, setActiveTab] = useState<'source' | 'diff'>('source');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Full Multi-Colored IDE Syntax Highlighter
  const renderSyntaxLine = (line: string) => {
    if (!line) return ' ';

    // Single line comments
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return <span className="code-syntax-comment">{line}</span>;
    }

    // Split strings first to preserve string contents
    const stringParts = line.split(/(['"`].*?['"`])/g);
    return stringParts.map((part, i) => {
      if (part.startsWith("'") || part.startsWith('"') || part.startsWith('`')) {
        return <span key={i} className="code-syntax-string">{part}</span>;
      }

      // Tokenize keywords, functions, types, and numbers
      const words = part.split(/\b([A-Za-z0-9_$]+)\b/g);
      return words.map((w, j) => {
        if (['import','export','from','const','let','var','function','async','await','return','if','else','try','catch','throw','new','type','interface','class','default','typeof','instanceof'].includes(w)) {
          return <span key={j} className="code-syntax-keyword">{w}</span>;
        }
        if (['Request','Response','ApiError','ApiResponse','Repository','AgentRun','User','Boolean','String','Number','Promise','Array'].includes(w)) {
          return <span key={j} className="code-syntax-type">{w}</span>;
        }
        if (/^\d+$/.test(w) || ['true','false','null','undefined'].includes(w)) {
          return <span key={j} className="code-syntax-number">{w}</span>;
        }
        if (/^[a-z][A-Za-z0-9_]*$/.test(w) && (words[j + 1] === '(' || words[j + 2] === '(')) {
          return <span key={j} className="code-syntax-function">{w}</span>;
        }
        return <span key={j} className="code-syntax-plain">{w}</span>;
      });
    });
  };

  if (activeTab === 'diff' && activePatchText) {
    return (
      <div className="h-full flex flex-col bg-[#12151A] text-[#E4E1D6]">
        {/* Header */}
        <div className="h-11 px-4 border-b border-[#262B33] bg-[#181C22] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('source')}
              className="text-xs text-[#8A8F97] hover:text-[#E4E1D6] flex items-center gap-1"
            >
              <FileCode className="w-3.5 h-3.5" /> Source
            </button>
            <ChevronRight className="w-3 h-3 text-[#8A8F97]/60" />
            <span className="text-xs font-bold text-[#C79A4B] flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-[#C79A4B]" /> CodeAtlas Change Patch Diff
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activePatchText)}
              className="atlas-btn-glass px-2.5 py-1 rounded-lg text-xs flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#7C9473]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Patch'}</span>
            </button>

            {activeRunId && (
              <a
                href={repositoryApi.getPatchDownloadUrl(activeRunId)}
                download={`codeatlas-change-${activeRunId.slice(0, 8)}.patch`}
                className="atlas-btn-primary px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5 text-[#12151A]" />
                <span>Download .patch</span>
              </a>
            )}
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono text-xs space-y-4 bg-[#12151A]">
          {activeReviewMd && (
            <div className="atlas-card p-3.5 text-[#E4E1D6] text-xs leading-relaxed">
              <div className="font-bold text-[#C79A4B] mb-1 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#7C9473]" /> Self-Review Assessment
              </div>
              <pre className="font-sans whitespace-pre-wrap text-[#E4E1D6]/90">{activeReviewMd}</pre>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#181C22] border border-[#262B33] overflow-x-auto">
            {activePatchText.split('\n').map((line, idx) => {
              const isAddition = line.startsWith('+') && !line.startsWith('+++');
              const isDeletion = line.startsWith('-') && !line.startsWith('---');
              const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 whitespace-pre ${
                    isAddition
                      ? 'bg-[#7C9473]/20 text-[#7C9473] border-l-2 border-[#7C9473]'
                      : isDeletion
                      ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500'
                      : isHeader
                      ? 'text-[#C79A4B] font-bold bg-[#1E232B]'
                      : 'text-[#E4E1D6]/90'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8A8F97] p-8 text-center bg-[#12151A]">
        <Code2 className="w-12 h-12 text-[#8A8F97]/40 mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-[#E4E1D6]">Select a file from the repository tree</p>
        <p className="text-xs text-[#8A8F97] mt-1 max-w-sm">
          Click any file in the explorer or click an evidence citation in the assistant panel to open line-numbered code.
        </p>
      </div>
    );
  }

  const lines = file.content.split('\n');

  return (
    <div className="h-full flex flex-col bg-[#12151A] text-[#E4E1D6]">
      {/* Viewer Header */}
      <div className="h-11 px-4 border-b border-[#262B33] bg-[#181C22] flex items-center justify-between">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-[#8A8F97] overflow-hidden">
          <FileCode className="w-4 h-4 text-[#C79A4B] shrink-0" />
          <span className="font-bold text-[#E4E1D6] truncate">{file.path}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E232B] text-[#4A8B85] border border-[#262B33] shrink-0 font-mono">
            {file.language} ({file.lineCount} lines)
          </span>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2">
          {activePatchText && (
            <button
              onClick={() => setActiveTab('diff')}
              className="atlas-btn-glass px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-[#C79A4B]" /> View Diff
            </button>
          )}

          {onInspectImpact && (
            <button
              onClick={() => onInspectImpact(file.path)}
              className="atlas-btn-glass px-2.5 py-1 rounded-lg text-xs flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-[#4A8B85]" /> Blast Radius
            </button>
          )}

          <button
            onClick={() => handleCopy(file.content)}
            className="atlas-btn-glass px-2 py-1 rounded-lg text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#7C9473]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono text-xs leading-relaxed bg-[#12151A]">
        <div className="min-w-max">
          {lines.map((lineContent, idx) => {
            const lineNumber = idx + 1;
            const isHighlighted =
              highlightRange &&
              lineNumber >= highlightRange.start &&
              lineNumber <= highlightRange.end;

            return (
              <div
                key={lineNumber}
                id={`line-${lineNumber}`}
                className={`flex items-baseline px-2 py-0.5 rounded transition-colors ${
                  isHighlighted
                    ? 'bg-[#C79A4B]/20 text-[#E4E1D6] border-l-2 border-[#C79A4B] shadow-sm shadow-[#C79A4B]/20 font-bold'
                    : 'hover:bg-[#181C22] text-[#E4E1D6]'
                }`}
              >
                <span className="w-10 text-right pr-4 text-[#8A8F97] select-none text-[11px] shrink-0 font-sans">
                  {lineNumber}
                </span>
                <span className="whitespace-pre">{renderSyntaxLine(lineContent)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
