import React from 'react';
import { ShieldCheck, Terminal } from 'lucide-react';

interface FooterProps {
  totalFiles: number;
  extractedSymbols: number;
}

export const Footer: React.FC<FooterProps> = ({ totalFiles, extractedSymbols }) => {
  return (
    <footer className="h-8 border-t border-[#262B33] bg-[#12151A] px-4 flex items-center justify-between text-[11px] text-[#8A8F97] select-none z-20 shadow-md">
      {/* Left Engine Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-[#E4E1D6]">
          <span className="w-2 h-2 rounded-full bg-[#7C9473] animate-pulse"></span>
          <span className="font-bold">CodeAtlas Engine v2.0</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-[#262B33]"></span>
        <div className="flex items-center gap-1 text-[#8A8F97]">
          <Terminal className="w-3 h-3 text-[#4A8B85]" />
          <span>AST Evidence Parser Active</span>
        </div>
      </div>

      {/* Center Stats */}
      <div className="hidden sm:flex items-center gap-4 font-mono text-[10px]">
        <span>Indexed Files: <strong className="text-[#E4E1D6]">{totalFiles}</strong></span>
        <span className="w-1 h-1 rounded-full bg-[#262B33]"></span>
        <span>Extracted Symbols: <strong className="text-[#C79A4B]">{extractedSymbols}</strong></span>
      </div>

      {/* Right Session Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[#7C9473] font-semibold bg-[#7C9473]/15 px-2.5 py-0.5 rounded-full border border-[#7C9473]/40">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7C9473]" />
          <span>Guest Session Active</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-[#262B33]"></span>
        <span className="text-[#8A8F97]/80">© 2026 CodeAtlas</span>
      </div>
    </footer>
  );
};
