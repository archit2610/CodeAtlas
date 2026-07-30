import React from 'react';
import { Route, X, Code2, ArrowRight, GitMerge } from 'lucide-react';
import type { RouteInspectionResult } from '../types';

interface RouteInspectorModalProps {
  routeMap: RouteInspectionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (filePath: string, line: number) => void;
  onTraceRoute?: (routePath: string) => void;
}

export const RouteInspectorModal: React.FC<RouteInspectorModalProps> = ({
  routeMap,
  isOpen,
  onClose,
  onSelectRoute,
  onTraceRoute
}) => {
  if (!isOpen || !routeMap) return null;

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-[#7C9473]/20 text-[#7C9473] border-[#7C9473]/50';
      case 'POST':
        return 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50';
      case 'PUT':
      case 'PATCH':
        return 'bg-[#818CF8]/20 text-[#818CF8] border-[#818CF8]/50';
      case 'DELETE':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      default:
        return 'bg-[#1E232B] text-[#8A8F97] border-[#262B33]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                API Route Map Inspector
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E232B] text-[#38BDF8] border border-[#262B33]">
                  {routeMap.totalRoutes} Routes
                </span>
              </h3>
              <p className="text-xs text-[#8A8F97]">
                Extracted API HTTP endpoints, handler symbols, and line numbers across {routeMap.routeFilesCount} route file(s).
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
          {routeMap.routes.length === 0 ? (
            <div className="p-8 text-center text-[#8A8F97] text-xs">
              No API routes detected in this repository snapshot.
            </div>
          ) : (
            routeMap.routes.map((endpoint, idx) => (
              <div
                key={idx}
                className="atlas-card group p-3.5 hover:border-[#38BDF8] flex items-center justify-between transition-all shadow-sm"
              >
                <div
                  onClick={() => {
                    onSelectRoute(endpoint.filePath, endpoint.line);
                    onClose();
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider border ${getMethodBadgeClass(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-[#E4E1D6] truncate">
                    {endpoint.routePath}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {endpoint.handlerSymbol && (
                    <span className="hidden sm:flex items-center gap-1 text-[#38BDF8] font-mono text-[11px] bg-[#1E232B] px-2 py-0.5 rounded-full border border-[#262B33]">
                      <Code2 className="w-3 h-3 text-[#4A8B85]" /> {endpoint.handlerSymbol}
                    </span>
                  )}
                  {onTraceRoute && (
                    <button
                      onClick={() => {
                        onTraceRoute(endpoint.routePath);
                        onClose();
                      }}
                      className="atlas-btn-primary px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow"
                      title="Trace end-to-end route execution flow"
                    >
                      <GitMerge className="w-3.5 h-3.5 text-[#12151A]" /> Trace Flow
                    </button>
                  )}
                  <span
                    onClick={() => {
                      onSelectRoute(endpoint.filePath, endpoint.line);
                      onClose();
                    }}
                    className="text-[#8A8F97] font-mono text-[11px] hover:text-[#E4E1D6] cursor-pointer flex items-center gap-1"
                  >
                    {endpoint.filePath}:L{endpoint.line}
                    <ArrowRight className="w-4 h-4 text-[#8A8F97] group-hover:text-[#38BDF8] transition-colors" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
