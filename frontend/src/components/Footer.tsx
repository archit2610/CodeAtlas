import React from 'react';
import { Terminal } from 'lucide-react';

interface FooterProps {
  totalFiles: number;
  extractedSymbols: number;
  githubUrl?: string;
  linkedinUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({
  totalFiles,
  extractedSymbols,
  githubUrl = 'https://github.com/archit2610/CodeAtlas',
  linkedinUrl = 'https://www.linkedin.com/in/archit-sarawagi-6b73872bb/'
}) => {
  return (
    <footer className="h-8 border-t border-[#262B33] bg-[#12151A] px-4 flex items-center justify-between text-[11px] text-[#8A8F97] select-none z-20 shadow-md">
      {/* Left Engine Info */}
      <div className="flex items-center gap-2 font-medium text-[#E4E1D6]">
        <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
        <span className="font-bold text-xs tracking-wide">CodeAtlas Engine v2.0</span>
      </div>

      {/* Center Stats */}
      <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-[#8A8F97]">
        <span>Indexed Files: <strong className="text-[#E4E1D6]">{totalFiles}</strong></span>
        <span className="w-1 h-1 rounded-full bg-[#262B33]"></span>
        <span>Symbols: <strong className="text-[#38BDF8]">{extractedSymbols}</strong></span>
      </div>

      {/* Right GitHub & LinkedIn Social Links */}
      <div className="flex items-center gap-4">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#8A8F97] hover:text-[#38BDF8] transition-colors"
          title="GitHub Profile"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="font-mono text-[10px] font-semibold">GitHub</span>
        </a>

        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#8A8F97] hover:text-[#38BDF8] transition-colors"
          title="LinkedIn Profile"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          <span className="font-mono text-[10px] font-semibold">LinkedIn</span>
        </a>
      </div>
    </footer>
  );
};
