import React from 'react';
import { X, TrendingUp, Shield, Zap, Globe } from 'lucide-react';

interface StrategicAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategicAnalysis = ({ isOpen, onClose }: StrategicAnalysisProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-geo-bg/80 backdrop-blur-2xl p-8">
      <div className="w-full max-w-6xl h-full glass-panel-strong rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-geo-border/50 flex items-center justify-between bg-gradient-to-r from-geo-accent/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-geo-accent/10 border border-geo-accent/20">
              <TrendingUp className="text-geo-accent" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display tracking-wide">Strategic Analysis</h2>
              <p className="text-[10px] text-geo-text-muted tracking-wider uppercase mt-0.5">Intelligence Terminal v2.0</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl hover:bg-geo-danger/10 hover:text-geo-danger transition-all duration-300 border border-transparent hover:border-geo-danger/20 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 no-scrollbar">
          {/* Risk Heatmap */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-geo-text-muted">Global Risk Distribution</h3>
            <div className="aspect-video rounded-2xl bg-geo-surface border border-geo-border relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/0/0/0.png')] bg-cover"></div>
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-geo-accent/15 blur-3xl animate-pulse"></div>
                <div className="w-48 h-48 rounded-full bg-geo-danger/15 blur-3xl animate-pulse delay-700 absolute top-10 left-20"></div>
                <div className="w-32 h-32 rounded-full bg-geo-warn/15 blur-3xl animate-pulse delay-1000 absolute bottom-20 right-40"></div>
                <div className="text-[10px] font-mono text-geo-accent/60 absolute top-4 left-4">SCANNING_SECTORS...</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Kinetic Probability', value: '84.2%', color: 'text-geo-danger' },
                { label: 'Market Stability', value: 'Critical', color: 'text-geo-warn' },
                { label: 'Cyber Exposure', value: 'Nominal', color: 'text-geo-success' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl border border-geo-border bg-geo-surface/50">
                  <div className="text-[9px] text-geo-text-muted uppercase mb-2">{s.label}</div>
                  <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-geo-text-muted">Sector Analysis</h3>
              {[
                { label: 'Energy Security', val: 78, color: 'bg-geo-accent' },
                { label: 'Maritime Trade', val: 45, color: 'bg-geo-danger' },
                { label: 'Air Superiority', val: 92, color: 'bg-geo-success' },
                { label: 'Cyber Resilience', val: 64, color: 'bg-geo-cyan' }
              ].map(s => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider">
                    <span className="text-geo-text-dim">{s.label}</span>
                    <span className="font-bold">{s.val}%</span>
                  </div>
                  <div className="h-1.5 bg-geo-border rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-geo-accent/20 bg-geo-accent/5 space-y-3">
              <div className="flex items-center gap-2 text-geo-accent">
                <Shield size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Strategic Recommendation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-geo-text-dim italic">
                "Current multipolar friction suggests a shift in naval deployment towards the Indo-Pacific. 
                Energy pipelines in Sector 4 remain vulnerable to asymmetric disruption."
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-geo-text-muted">Live Telemetry</h3>
              <div className="font-mono text-[10px] space-y-2">
                {[
                  { label: 'SATELLITE_LINK', value: 'ACTIVE', color: 'text-geo-success' },
                  { label: 'ENCRYPTION', value: 'AES-256', color: 'text-geo-text-dim' },
                  { label: 'LATENCY', value: '14ms', color: 'text-geo-text-dim' },
                  { label: 'THREAT_LEVEL', value: 'HIGH', color: 'text-geo-danger' },
                ].map(t => (
                  <div key={t.label} className="flex justify-between p-2 rounded-lg border border-geo-border/30 bg-geo-surface/30">
                    <span className="text-geo-text-muted">{t.label}</span>
                    <span className={`font-semibold ${t.color}`}>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-geo-border/30 text-[9px] tracking-[0.3em] text-center text-geo-text-muted uppercase">
          CLASSIFIED // GEOECONORBIT INTELLIGENCE PROTOCOL // AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
};
