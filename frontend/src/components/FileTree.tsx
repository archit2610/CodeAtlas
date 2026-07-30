import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  FileCode2,
  ChevronRight,
  ChevronDown,
  Search,
  Zap,
  Layers,
  Cpu,
  Route,
  Database,
  Compass,
  FolderMinus,
  FolderPlus
} from 'lucide-react';
import type { RepositoryFileSummary } from '../types';
import { buildFileTree, getParentFolderPaths, type TreeNode } from '../lib/treeUtils';

interface FileTreeProps {
  files: RepositoryFileSummary[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onInspectImpact?: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onInspectImpact
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/routes', 'src/controllers', 'src/services']));
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  useEffect(() => {
    setTreeData(buildFileTree(files));
  }, [files]);

  useEffect(() => {
    if (activeFilePath) {
      const parents = getParentFolderPaths(activeFilePath);
      setExpandedFolders(prev => {
        const next = new Set(prev);
        parents.forEach(p => next.add(p));
        return next;
      });
    }
  }, [activeFilePath]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
  };

  const getAllFolderPaths = (nodes: TreeNode[]): string[] => {
    let paths: string[] = [];
    for (const node of nodes) {
      if (node.isFolder) {
        paths.push(node.path);
        paths = paths.concat(getAllFolderPaths(node.children));
      }
    }
    return paths;
  };

  const handleExpandAll = () => {
    const allPaths = getAllFolderPaths(treeData);
    setExpandedFolders(new Set(allPaths));
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'route':
        return <Route className="w-3.5 h-3.5 text-[#4A8B85]" />;
      case 'model':
        return <Database className="w-3.5 h-3.5 text-[#7C9473]" />;
      case 'service':
        return <Zap className="w-3.5 h-3.5 text-[#4A8B85]" />;
      case 'controller':
        return <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case 'component':
        return <Layers className="w-3.5 h-3.5 text-[#4A8B85]" />;
      default:
        return <FileCode2 className="w-3.5 h-3.5 text-[#8A8F97]" />;
    }
  };

  const filteredFiles = searchQuery.trim()
    ? files.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = activeFilePath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path} className="select-none">
          <button
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className="w-full flex items-center gap-1.5 py-1.5 px-2 hover:bg-[#1E232B] rounded-md text-xs text-[#8A8F97] transition-colors group"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8F97] group-hover:text-[#E4E1D6]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8A8F97] group-hover:text-[#E4E1D6]" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#38BDF8]" />
            ) : (
              <Folder className="w-4 h-4 text-[#8A8F97] group-hover:text-[#38BDF8]" />
            )}
            <span className="font-medium text-[#E4E1D6]/80 group-hover:text-[#E4E1D6] truncate">
              {node.name}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-l border-[#262B33] ml-4"
              >
                {node.children.map(child => renderNode(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div key={node.path} className="relative group">
        {/* Animated Jumper Guide Beam for active selection */}
        {isActive && (
          <motion.div
            layoutId="activeFileBeam"
            className="absolute inset-0 bg-[#38BDF8]/20 border-l-2 border-[#38BDF8] rounded-r-md pointer-events-none"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        <div
          onClick={() => onSelectFile(node.path)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-xs cursor-pointer transition-all ${
            isActive
              ? 'text-[#E4E1D6] font-bold bg-[#38BDF8]/15'
              : 'text-[#E4E1D6]/70 hover:text-[#E4E1D6] hover:bg-[#1E232B]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {getClassificationIcon(node.fileData?.classification ?? 'source')}
            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.fileData && (
              <span className="text-[10px] text-[#8A8F97] group-hover:text-[#4A8B85] transition-colors">
                {node.fileData.lineCount}L
              </span>
            )}
            {onInspectImpact && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectImpact(node.path);
                }}
                title="Inspect Blast Radius & Impact"
                className="opacity-0 group-hover:opacity-100 text-[#8A8F97] hover:text-[#38BDF8] p-0.5 rounded transition-opacity"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#181C22] border-r border-[#262B33] text-[#E4E1D6]">
      {/* Tree Header with Search & Collapse All / Expand All Action Buttons */}
      <div className="p-3 border-b border-[#262B33] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            Repository Explorer
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#38BDF8] transition-colors border border-[#262B33] flex items-center gap-1 text-[10px]"
              title="Collapse All Folders"
            >
              <FolderMinus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Collapse</span>
            </button>
            <button
              onClick={handleExpandAll}
              className="p-1 rounded bg-[#12151A] hover:bg-[#1E232B] text-[#8A8F97] hover:text-[#38BDF8] transition-colors border border-[#262B33] flex items-center gap-1 text-[10px]"
              title="Expand All Folders"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand</span>
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12151A] text-[#4A8B85] border border-[#262B33]">
              {files.length} Files
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8A8F97] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12151A] border border-[#262B33] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#E4E1D6] placeholder-[#8A8F97]/60 focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-all"
          />
        </div>
      </div>

      {/* Tree Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {filteredFiles ? (
          filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer ${
                  activeFilePath === file.path ? 'bg-[#38BDF8]/20 text-[#E4E1D6] border-l-2 border-[#38BDF8]' : 'hover:bg-[#1E232B] text-[#E4E1D6]/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getClassificationIcon(file.classification)}
                  <span className="truncate">{file.path}</span>
                </div>
                <span className="text-[10px] text-[#8A8F97]">{file.lineCount} lines</span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#8A8F97]">
              No files matching "{searchQuery}"
            </div>
          )
        ) : (
          treeData.map(node => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
