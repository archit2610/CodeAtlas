import React, { useState } from 'react';
import { GitBranch, Sparkles, FolderGit2, Play, Search, Cpu } from 'lucide-react';
import type { Repository } from '../types';

interface NavbarProps {
  activeRepository: Repository | null;
  onImportDemo: () => void;
  onImportGithub: (url: string) => void;
  isImporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRepository,
  onImportDemo,
  onImportGithub,
  isImporting
}) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubUrl.trim()) {
      onImportGithub(githubUrl.trim());
      setGithubUrl('');
      setIsInputOpen(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#262B33] bg-[#181C22] px-4 flex items-center justify-between z-30 sticky top-0 shadow-lg shadow-black/40">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C79A4B] via-[#D9A956] to-[#4A8B85] p-[1px] shadow-lg shadow-[#C79A4B]/20">
          <div className="w-full h-full bg-[#12151A] rounded-[11px] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#C79A4B]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-[#E4E1D6]">
              CodeAtlas
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#1E232B] text-[#C79A4B] border border-[#262B33]">
              v2.0 MVP
            </span>
          </div>
          <p className="text-[11px] text-[#8A8F97] hidden sm:block font-medium">
            Evidence-Backed Repository Intelligence
          </p>
        </div>
      </div>

      {/* Active Repository Badge */}
      {activeRepository && (
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#12151A] border border-[#262B33] text-xs">
          <div className="flex items-center gap-1.5 text-[#E4E1D6] font-semibold">
            <FolderGit2 className="w-4 h-4 text-[#C79A4B]" />
            <span>{activeRepository.owner ? `${activeRepository.owner}/` : ''}{activeRepository.name}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[#8A8F97]"></span>
          <div className="flex items-center gap-1.5 text-[#8A8F97] font-mono text-[11px]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{activeRepository.sourceType === 'demo' ? 'demo-saas' : 'main'}</span>
          </div>
          {/* Distinct Muted Sage Ready Badge */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#7C9473]/15 text-[#7C9473] border border-[#7C9473]/40">
            {activeRepository.status}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Import Button (Muted Brass Gold Primary Accent) */}
        <button
          onClick={onImportDemo}
          disabled={isImporting}
          className="atlas-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#12151A]" />
          <span>Try Demo Repo</span>
        </button>

        {/* GitHub Import Input / Button */}
        {isInputOpen ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A8F97] absolute left-3 top-2.5" />
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-64 sm:w-80 bg-[#12151A] border border-[#262B33] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E4E1D6] placeholder-[#8A8F97]/60 focus:outline-none focus:border-[#C79A4B] focus:ring-1 focus:ring-[#C79A4B] transition-all shadow-inner"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isImporting || !githubUrl.trim()}
              className="px-3.5 py-2 bg-[#1E232B] hover:bg-[#262B33] border border-[#262B33] rounded-xl text-xs font-semibold text-[#E4E1D6] disabled:opacity-50"
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => setIsInputOpen(false)}
              className="text-xs text-[#8A8F97] hover:text-[#E4E1D6] px-1"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsInputOpen(true)}
            disabled={isImporting}
            className="atlas-btn-glass flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C79A4B]" />
            <span className="hidden sm:inline">Paste GitHub URL</span>
          </button>
        )}
      </div>
    </header>
  );
};
