import React from 'react';
import { Compass, X, AlertTriangle, ShieldCheck, Zap, ArrowRight, Route } from 'lucide-react';
import type { BlastRadiusResult } from '../types';

interface ImpactInspectorModalProps {
  impact: BlastRadiusResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (filePath: string) => void;
}

export const ImpactInspectorModal: React.FC<ImpactInspectorModalProps> = ({
  impact,
  isOpen,
  onClose,
  onSelectFile
}) => {
  if (!isOpen || !impact) return null;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return {
          badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-800',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          title: 'High Change Risk'
        };
      case 'medium':
        return {
          badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-800',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          title: 'Medium Change Risk'
        };
      default:
        return {
          badgeClass: 'bg-[#7C9473]/20 text-[#7C9473] border-[#7C9473]/50',
          icon: <ShieldCheck className="w-4 h-4 text-[#7C9473]" />,
          title: 'Low Change Risk'
        };
    }
  };

  const riskInfo = getRiskBadge(impact.riskLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12151A]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#12151A] border border-[#262B33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262B33] flex items-center justify-between bg-[#181C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E232B] border border-[#262B33] flex items-center justify-center text-[#C79A4B]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E4E1D6] flex items-center gap-2">
                Blast Radius & Risk Predictor
              </h3>
              <p className="text-xs text-[#8A8F97] font-mono">Target: {impact.filePath}</p>
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
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 bg-[#12151A]">
          {/* Risk Level Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${riskInfo.badgeClass}`}>
            <div className="flex items-center gap-3">
              {riskInfo.icon}
              <div>
                <span className="font-extrabold uppercase text-xs tracking-wider">{riskInfo.title}</span>
                <p className="text-xs text-[#E4E1D6]/90 mt-0.5">{impact.summary}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black">{impact.riskScore}/100</div>
              <span className="text-[10px] text-[#8A8F97] uppercase font-bold">Risk Score</span>
            </div>
          </div>

          {/* Direct Dependents List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C79A4B] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#C79A4B]" /> Direct File Dependents ({impact.directDependents.length})
            </h4>
            {impact.directDependents.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#181C22] border border-[#262B33] text-xs text-[#8A8F97]">
                No direct dependent files. This file can be modified with minimal isolation risk.
              </div>
            ) : (
              <div className="space-y-1.5">
                {impact.directDependents.map((dep, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectFile(dep.fromPath);
                      onClose();
                    }}
                    className="atlas-card p-2.5 hover:border-[#C79A4B] cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-mono text-[#C79A4B]">{dep.fromPath}</span>
                    <span className="text-[#8A8F97] text-[11px] flex items-center gap-1">
                      Line {dep.sourceLine} <ArrowRight className="w-3 h-3 text-[#8A8F97]" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impacted API Routes */}
          {impact.affectedRoutes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C79A4B] flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-[#4A8B85]" /> Affected API Routes ({impact.affectedRoutes.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {impact.affectedRoutes.map((route, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#1E232B] text-[#4A8B85] border border-[#262B33] text-xs font-mono"
                  >
                    {route}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
