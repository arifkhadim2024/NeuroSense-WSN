import React, { useState } from 'react';
import { 
  Trophy, BarChart3, TrendingUp, Activity, FileSpreadsheet
} from 'lucide-react';
import { BenchmarkLab } from './BenchmarkLab';
import { AlgorithmComparison } from './AlgorithmComparison';
import { ResearchResults } from './ResearchResults';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ResearchPlotsLab } from './ResearchPlotsLab';
import { soundFX } from '../utils/soundEffects';

export const ResultsView: React.FC = () => {
  const [activeResultsTab, setActiveResultsTab] = useState<'benchmarks' | 'comparisons' | 'tables' | 'dashboard' | 'plots'>('benchmarks');

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* 1. Header */}
      <div className="text-center max-w-4xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
          Empirical Results &amp; Academic Verification
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-mono">
          Research Benchmarks &amp; Performance Verification
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
          Statistically verified across 100 random seeds comparing the proposed ANN + PSO-Hybrid architecture against classical LEACH, PEGASIS, and Hybrid benchmarks.
        </p>
      </div>

      {/* 2. Sub-Lab Switcher Tabs */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0D1626] p-2 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          
          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResultsTab('benchmarks');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResultsTab === 'benchmarks'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-300" />
            <span>100-Seed Academic Benchmark</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResultsTab('comparisons');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResultsTab === 'comparisons'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Algorithm Comparison &amp; Radar</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResultsTab('tables');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResultsTab === 'tables'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-violet-300" />
            <span>Publication Data Tables</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResultsTab('dashboard');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResultsTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-300" />
            <span>Telemetry Dashboard</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResultsTab('plots');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResultsTab === 'plots'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-300" />
            <span>Scrubbable 3D Plots</span>
          </button>

        </div>

        <div className="text-[11px] text-slate-400 hidden lg:block pr-2">
          Active: <strong className="text-white capitalize">{activeResultsTab.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* 3. Dynamic Sub-Lab Content */}
      <div className="space-y-6">
        {activeResultsTab === 'benchmarks' && (
          <div className="space-y-6 animate-fadeIn">
            <BenchmarkLab />
          </div>
        )}

        {activeResultsTab === 'comparisons' && (
          <div className="space-y-6 animate-fadeIn">
            <AlgorithmComparison />
          </div>
        )}

        {activeResultsTab === 'tables' && (
          <div className="space-y-6 animate-fadeIn">
            <ResearchResults />
          </div>
        )}

        {activeResultsTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <AnalyticsDashboard />
          </div>
        )}

        {activeResultsTab === 'plots' && (
          <div className="space-y-6 animate-fadeIn">
            <ResearchPlotsLab />
          </div>
        )}
      </div>

    </div>
  );
};
