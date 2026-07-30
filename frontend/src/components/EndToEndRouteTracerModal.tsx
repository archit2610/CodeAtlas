import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitMerge,
  X,
  ArrowDown,
  FileCode,
  ExternalLink,
  Loader2,
  Cpu,
  Route as RouteIcon,
  Server,
  Database,
  ChevronDown
} from 'lucide-react';
import type { RouteInspectionResult, RouteTraceResult } from '../types';
import { repositoryApi } from '../lib/repositoryApi';

interface EndToEndRouteTracerModalProps {
  repositoryId: string | null;
  routeMap: RouteInspectionResult | null;
  initialRoutePath: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCodeLocation: (filePath: string, line: number) => void;
}

export const EndToEndRouteTracerModal: React.FC<EndToEndRouteTracerModalProps> = ({
  repositoryId,
  routeMap,
  initialRoutePath,
  isOpen,
  onClose,
  onSelectCodeLocation
}) => {
  const [selectedRoutePath, setSelectedRoutePath] = useState<string>('');
  const [traceResult, setTraceResult] = useState<RouteTraceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && routeMap && routeMap.routes.length > 0) {
      const defaultPath = initialRoutePath || routeMap.routes[0].routePath;
      setSelectedRoutePath(defaultPath);
      loadTrace(defaultPath);
    }
  }, [isOpen, routeMap, initialRoutePath]);

  const loadTrace = async (routePath: string) => {
    if (!repositoryId || !routePath) return;
    try {
      setIsLoading(true);
      const data = await repositoryApi.getRouteTrace(repositoryId, routePath);
      setTraceResult(data);
    } catch (e) {
      console.error('Failed to trace route flow:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteChange = (newPath: string) => {
    setSelectedRoutePath(newPath);
    loadTrace(newPath);
  };

  if (!isOpen || !routeMap) return null;

  const getLayerIcon = (layer: string) => {
    switch (layer) {
      case 'route':
        return <RouteIcon className="w-4 h-4 text-[#4A8B85]" />;
      case 'controller':
        return <Cpu className="w-4 h-4 text-[#38BDF8]" />;
      case 'service':
        return <Server className="w-4 h-4 text-[#818CF8]" />;
      case 'model':
        return <Database className="w-4 h-4 text-[#7C9473]" />;
      default:
        return <FileCode className="w-4 h-4 text-[#8A8F97]" />;
    }
  };

  const getLayerBadgeClass = (layer: string) => {
    switch (layer) {
      case 'route':
        return 'bg-[#4A8B85]/20 text-[#4A8B85] border-[#4A8B85]/40';
      case 'controller':
        return 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40';
      case 'service':
        return 'bg-[#818CF8]/20 text-[#818CF8] border-[#818CF8]/40';
      case 'model':
        return 'bg-[#7C9473]/20 text-[#7C9473] border-[#7C9473]/40';
      default:
        return 'bg-[#1E232B] text-[#8A8F97] border-[#262B33]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22] shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#38BDF8]">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                End-to-End Route Flow Tracer
              </h3>
              <p className="text-xs text-[#8A8F97] flex items-center gap-1.5 pt-0.5">
                HTTP Route Entry <span className="text-[#38BDF8]">→</span> Controller Handler <span className="text-[#38BDF8]">→</span> Service Logic <span className="text-[#38BDF8]">→</span> Database Model
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

        {/* Route Endpoint Selector Dropdown */}
        <div className="px-6 py-3 border-b border-[#262B33] bg-[#181C22] shrink-0 flex items-center gap-3">
          <span className="text-xs font-bold text-[#8A8F97] uppercase tracking-wider shrink-0">
            Select Route:
          </span>
          <div className="relative flex-1 max-w-md">
            <select
              value={selectedRoutePath}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="w-full bg-[#12151A] border border-[#262B33] rounded-xl px-3.5 py-2 text-xs text-[#E4E1D6] font-mono appearance-none focus:outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              {routeMap.routes.map((r, i) => (
                <option key={i} value={r.routePath}>
                  {r.method} {r.routePath} ({r.filePath.split('/').pop()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#8A8F97] absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Modal Body: Request Flow Pipeline */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-6 bg-[#12151A]">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-[#38BDF8] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">Tracing end-to-end route execution path...</span>
            </div>
          ) : traceResult && traceResult.steps.length > 0 ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              {traceResult.steps.map((step, idx) => (
                <div key={idx} className="space-y-3">
                  {/* Step Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="atlas-card p-4 space-y-3 hover:border-[#38BDF8] transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#12151A] border border-[#262B33] flex items-center justify-center shrink-0">
                          {getLayerIcon(step.layer)}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#E4E1D6] block">
                            Step {step.stepIndex}: {step.title}
                          </span>
                          <span className="text-[11px] text-[#8A8F97] font-mono">
                            {step.filePath}:L{step.line}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getLayerBadgeClass(step.layer)}`}>
                          {step.layer}
                        </span>
                        <button
                          onClick={() => {
                            onSelectCodeLocation(step.filePath, step.line);
                            onClose();
                          }}
                          className="atlas-btn-glass px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-[#38BDF8]" /> Open Code
                        </button>
                      </div>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="p-3 rounded-xl bg-[#12151A] border border-[#262B33] font-mono text-xs text-[#38BDF8] overflow-x-auto">
                      <code className="whitespace-pre">{step.codeSnippet}</code>
                    </div>
                  </motion.div>

                  {/* Flow Arrow Connector between steps */}
                  {idx < traceResult.steps.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <div className="w-8 h-8 rounded-full bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#38BDF8] shadow-sm">
                        <ArrowDown className="w-4 h-4 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#8A8F97] text-xs">
              Select a route to generate its end-to-end request pipeline trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
