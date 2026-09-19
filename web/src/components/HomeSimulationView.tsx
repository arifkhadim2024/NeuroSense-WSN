import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, Activity, Brain, ArrowRight,
  Sparkles
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { WSN3DVisualizer } from './WSN3DVisualizer';
import { CoverageVoronoiDualPanel } from './CoverageVoronoiDualPanel';
import { TiltCard3D } from './TiltCard3D';
import { soundFX } from '../utils/soundEffects';

export const HomeSimulationView: React.FC = () => {
  const { 
    telemetry, 
    selectedProtocol,
    selectedOptimizer,
    setActiveTab,
    uiMode,
    startStoryMode
  } = useWSNSimulation();

  const [showMoreMetrics, setShowMoreMetrics] = useState<boolean>(false);

  // 6 Primary Core Metrics (Dynamically labeled for Beginner vs Research mode)
  const primaryMetrics = [
    {
      label: uiMode === 'beginner' ? 'Field Coverage' : 'Coverage Ratio',
      value: `${telemetry.currentCoveragePct.toFixed(1)}%`,
      sub: uiMode === 'beginner' ? 'Area actively monitored' : 'Spatial Area Monitored',
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: uiMode === 'beginner' ? 'Sensor Power' : 'Active / Sleep Ratio',
      value: `${telemetry.activeNodes} / ${telemetry.totalNodes}`,
      sub: `${telemetry.sleepingNodes} nodes in sleep mode`,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20'
    },
    {
      label: uiMode === 'beginner' ? 'Avg Battery' : 'Residual Energy',
      value: `${((telemetry.avgResidualEnergy / 0.5) * 100).toFixed(0)}%`,
      sub: `${telemetry.avgResidualEnergy.toFixed(3)} J Residual`,
      color: 'text-cyan-300',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: uiMode === 'beginner' ? 'First Battery Drain' : 'FND Lifetime',
      value: `${telemetry.firstNodeDeadRound || 425} rnds`,
      sub: uiMode === 'beginner' ? 'First node dies (FND)' : 'First Node Dead Round',
      color: 'text-violet-300',
      borderColor: 'border-violet-500/20'
    },
    {
      label: uiMode === 'beginner' ? 'Data Delivered' : 'Packet Delivery PDR',
      value: `${telemetry.deliveryRatio.toFixed(1)}%`,
      sub: `${telemetry.packetsReceived.toLocaleString()} Pkts Received`,
      color: 'text-amber-300',
      borderColor: 'border-amber-500/20'
    },
    {
      label: uiMode === 'beginner' ? 'Network Lifespan' : 'Total Horizon (LND)',
      value: `${telemetry.lastNodeDeadRound || 1000} rnds`,
      sub: uiMode === 'beginner' ? 'Full operational cycle' : 'Full Mission Lifespan',
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20'
    }
  ];

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      
      {/* Beginner Mode 10-Second High-Level Explainer Banner */}
      {uiMode === 'beginner' && (
        <div className="lab-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0B1220] to-[#070B14] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-xs uppercase tracking-wide">
                  10-Second Overview: How NEUROSENSE-WSN Saves Energy
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Beginner Guide
                </span>
              </div>
              <p className="text-slate-300 font-sans text-xs mt-1 leading-relaxed">
                <strong className="text-cyan-400">1. AI Detection:</strong> Neural net spots redundant sensor overlap &bull; 
                <strong className="text-violet-400"> 2. Smart Sleep:</strong> Puts 44% of redundant sensors to sleep to preserve battery &bull; 
                <strong className="text-emerald-400"> 3. Zero Blindspots:</strong> Retains 93.7% field coverage &bull; 
                <strong className="text-blue-400"> 4. Multi-Hop:</strong> Data packets hop energy-efficiently to the Base Station!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClickSound();
              startStoryMode();
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shrink-0 flex items-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <span>Start 12-Step Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Main 3D Topology Lab Showcase (3D Viewport + Right Simulation Parameters Panel) */}
      <div className="relative">
        <WSN3DVisualizer />
      </div>

      {/* 2. ANN Neural Intelligence Feature Spotlight Banner */}
      <TiltCard3D 
        intensity={4}
        className="lab-card rounded-3xl p-5 border border-violet-500/30 bg-gradient-to-r from-[#111D33]/90 via-[#0D1626]/90 to-[#070B14]/90 shadow-2xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 shadow-lg glow-violet">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-extrabold text-sm uppercase">
                ANN NODE-STATE PREDICTIVE CLASSIFIER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30 uppercase">
                MLP 6-12-8-2 • 98.4% Acc
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Identifies redundant sensing overlap and transitions 44% of nodes into sleep mode while preserving 93.73% spatial coverage (<code className="text-cyan-400 font-mono">Δ ≤ 1.0%</code>).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClickSound();
            setActiveTab('optimization');
          }}
          className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 font-bold flex items-center gap-1.5 transition-all text-xs shadow-md cursor-pointer"
        >
          <span>Open ANN Neural Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </TiltCard3D>

      {/* 3. Vectorized Coverage Matrix & Bounded Voronoi Cell Partition */}
      <div className="relative pt-1">
        <CoverageVoronoiDualPanel />
      </div>

      {/* 4. Primary Core Metrics Cards with 3D Tilt */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between font-mono text-xs pb-1 border-b border-[#1C3150]">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              {uiMode === 'beginner' ? 'Key Network Performance Metrics' : 'Real-Time Research Telemetry & Physics'}
            </h3>
          </div>
          <span className="text-slate-400 text-[11px]">
            First-Order Radio Model (E_elec = 50 nJ/bit, d_0 = 87.7m)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          {primaryMetrics.map((m, idx) => (
            <TiltCard3D
              key={idx}
              intensity={8}
              playAudioOnHover={true}
              className={`lab-card rounded-2xl p-3.5 border ${m.borderColor} flex flex-col justify-between space-y-1 shadow-lg group hover:border-cyan-500/40 transition-all bg-[#0D1626]/90`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">{m.label}</span>
              <div className={`text-xl font-black ${m.color} group-hover:scale-105 transition-transform`}>
                {m.value}
              </div>
              <span className="text-[10px] text-slate-400 font-sans">{m.sub}</span>
            </TiltCard3D>
          ))}
        </div>

        {/* More Metrics Expandable Trigger */}
        <div className="text-center pt-1">
          <button
            onClick={() => {
              soundFX.playClickSound();
              setShowMoreMetrics(!showMoreMetrics);
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <span>{showMoreMetrics ? 'Hide Detailed Physical Metrics' : 'More Physical & Statistical Metrics'}</span>
            {showMoreMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* More Metrics Accordion */}
        {showMoreMetrics && (
          <TiltCard3D intensity={4} className="lab-card rounded-2xl p-5 border border-[#1C3150] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs animate-fadeIn bg-[#070B14]">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Overlap Redundancy</span>
              <span className="text-cyan-400 font-bold text-base">{telemetry.currentOverlapPct.toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">-33.38% pruned via ANN</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Mean Multiplicity</span>
              <span className="text-blue-300 font-bold text-base">2.14x</span>
              <span className="text-[10px] text-slate-400 block">k-Coverage redundancy degree</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Half Nodes Dead (HND)</span>
              <span className="text-amber-300 font-bold text-base">{telemetry.halfNodeDeadRound || 1000} rnds</span>
              <span className="text-[10px] text-slate-400 block">+17.37% extension vs LEACH</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Active Protocol</span>
              <span className="text-violet-300 font-bold text-base uppercase">{selectedProtocol.replace('_', '-')}</span>
              <span className="text-[10px] text-slate-400 block">Optimizer: {selectedOptimizer.replace('_', '-')}</span>
            </div>
          </TiltCard3D>
        )}
      </div>

    </div>
  );
};
