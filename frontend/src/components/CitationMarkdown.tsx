import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileCode, ExternalLink } from 'lucide-react';

interface CitationMarkdownProps {
  content: string;
  onSelectCitation: (path: string, startLine: number, endLine: number) => void;
}

export const CitationMarkdown: React.FC<CitationMarkdownProps> = ({
  content,
  onSelectCitation
}) => {
  const parseCitationText = (text: string) => {
    const citationRegex = /((?:[a-zA-Z0-9_\-]+\/)+[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+(?::L\d+(?:-L\d+)?)?)/g;
    const parts = text.split(citationRegex);

    if (parts.length <= 1) return text;

    return parts.map((part, idx) => {
      const match = part.match(/^((?:[a-zA-Z0-9_\-]+\/)+[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)(?::L(\d+)(?:-L(\d+))?)?$/);
      if (match) {
        const filePath = match[1];
        const startLine = match[2] ? parseInt(match[2], 10) : 1;
        const endLine = match[3] ? parseInt(match[3], 10) : startLine;

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectCitation(filePath, startLine, endLine);
            }}
            title={`Click to jump to ${filePath} line ${startLine}`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 mx-1 rounded-md bg-[#4A8B85]/20 hover:bg-[#4A8B85]/35 border border-[#4A8B85]/50 text-[#E4E1D6] font-mono text-[11px] font-semibold cursor-pointer transition-all hover:scale-[1.03] active:scale-95 shadow-sm align-baseline whitespace-nowrap"
          >
            <FileCode className="w-3 h-3 text-[#4A8B85] shrink-0" />
            <span>{part}</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#4A8B85]/80 shrink-0" />
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="markdown-body text-xs sm:text-sm text-[#E4E1D6] leading-relaxed space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            const processChildren = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') return parseCitationText(node);
              if (Array.isArray(node)) return node.map(processChildren);
              return node;
            };
            return <p className="mb-3 leading-relaxed text-[#E4E1D6]/90">{processChildren(children)}</p>;
          },
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-2 mb-4">{children}</ol>,
          li: ({ children }) => {
            const processChildren = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') return parseCitationText(node);
              if (Array.isArray(node)) return node.map(processChildren);
              return node;
            };
            return <li className="text-[#E4E1D6]/90 leading-relaxed">{processChildren(children)}</li>;
          },
          h1: ({ children }) => <h1 className="text-lg font-bold text-[#E4E1D6] mt-4 mb-2 border-b border-[#262B33] pb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-[#C79A4B] mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-[#4A8B85] mt-3 mb-1.5">{children}</h3>,
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            const strContent = String(children).trim();

            if (!isBlock) {
              const match = strContent.match(/^((?:[a-zA-Z0-9_\-]+\/)+[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)(?::L(\d+)(?:-L(\d+))?)?$/);
              if (match) {
                const filePath = match[1];
                const startLine = match[2] ? parseInt(match[2], 10) : 1;
                const endLine = match[3] ? parseInt(match[3], 10) : startLine;

                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectCitation(filePath, startLine, endLine);
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md bg-[#4A8B85]/20 hover:bg-[#4A8B85]/35 border border-[#4A8B85]/50 text-[#E4E1D6] font-mono text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap"
                  >
                    <FileCode className="w-3 h-3 text-[#4A8B85]" />
                    <span>{strContent}</span>
                  </button>
                );
              }
            }

            return (
              <code className="bg-[#1E232B] text-[#C79A4B] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#262B33]">
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
