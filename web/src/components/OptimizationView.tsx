import React, { useState } from 'react';
import { 
  Brain, Sparkles, ShieldCheck
} from 'lucide-react';
import { ANNNeuralLab } from './ANNNeuralLab';
import { OptimizationLab } from './OptimizationLab';
import { CoverageLab } from './CoverageLab';
import { soundFX } from '../utils/soundEffects';

export const OptimizationView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ann_engine' | 'mopso_swarm' | 'coverage_lab'>('ann_engine');

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* 1. Header with Core Research Thesis Context */}
      <div className="text-center max-w-4xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Brain className="w-3.5 h-3.5" />
          Optimization Layer (ANN + EA-VVF-MOPSO Swarm)
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-mono">
          ANN Node Prediction &amp; Particle Swarm Spatial Repositioning
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
          The Artificial Neural Network extracts 10 spatial features per sensor to predict coverage contribution and redundancy. Particle Swarm Optimization then computes multi-objective force vectors to reposition nodes, eliminating overlap and blindspots.
        </p>
      </div>

      {/* 2. Sub-Lab Switcher Tabs */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0D1626] p-2 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          
          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveSubTab('ann_engine');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeSubTab === 'ann_engine'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Brain className="w-4 h-4 text-violet-300" />
            <span>ANN Neural Engine (10-D Features)</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveSubTab('mopso_swarm');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeSubTab === 'mopso_swarm'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>EA-VVF-MOPSO Swarm Lab</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveSubTab('coverage_lab');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeSubTab === 'coverage_lab'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Coverage &amp; Overlap Reduction</span>
          </button>

        </div>

        <div className="text-[11px] text-slate-400 hidden lg:block pr-2">
          Active: <strong className="text-white capitalize">{activeSubTab.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* 3. Sub-Lab Dynamic Content */}
      <div className="space-y-6">
        {activeSubTab === 'ann_engine' && (
          <div className="space-y-6 animate-fadeIn">
            <ANNNeuralLab />
          </div>
        )}

        {activeSubTab === 'mopso_swarm' && (
          <div className="space-y-6 animate-fadeIn">
            <OptimizationLab />
          </div>
        )}

        {activeSubTab === 'coverage_lab' && (
          <div className="space-y-6 animate-fadeIn">
            <CoverageLab />
          </div>
        )}
      </div>

    </div>
  );
};
