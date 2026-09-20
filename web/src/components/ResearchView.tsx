import React, { useState } from 'react';
import { 
  BookOpen, Code2, FileText, Hexagon, ShieldCheck
} from 'lucide-react';
import { ResearchTheory } from './ResearchTheory';
import { VoronoiLab } from './VoronoiLab';
import { CoverageVoronoiDualPanel } from './CoverageVoronoiDualPanel';
import { CoverageMatrixLab } from './CoverageMatrixLab';
import { CoverageAnalytics } from './CoverageAnalytics';
import { SourceCodeViewer } from './SourceCodeViewer';
import { MasterGuideViewer } from './MasterGuideViewer';
import { soundFX } from '../utils/soundEffects';

export const ResearchView: React.FC = () => {
  const [activeResearchTab, setActiveResearchTab] = useState<
    'theory_math' | 'voronoi_geometry' | 'coverage_matrix' | 'source_code' | 'master_guide'
  >('theory_math');

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* 1. Header */}
      <div className="text-center max-w-4xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <BookOpen className="w-3.5 h-3.5" />
          Theoretical Foundation &amp; Technical Repository
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-mono">
          Mathematical Formulation, Algorithms &amp; Research Guide
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
          Full mathematical equations for the ANN architecture, Particle Swarm velocities, Voronoi spatial boundaries, Vectorized Coverage Matrix, and First-Order Radio Energy Model.
        </p>
      </div>

      {/* 2. Sub-Lab Switcher Tabs */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0D1626] p-2 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          
          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResearchTab('theory_math');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResearchTab === 'theory_math'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Math &amp; Radio Energy Equations</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResearchTab('voronoi_geometry');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResearchTab === 'voronoi_geometry'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Hexagon className="w-4 h-4 text-violet-300" />
            <span>Voronoi Spatial Geometry</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResearchTab('coverage_matrix');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResearchTab === 'coverage_matrix'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vectorized Coverage Matrix Lab</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResearchTab('source_code');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResearchTab === 'source_code'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-300" />
            <span>Python Source Code</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveResearchTab('master_guide');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeResearchTab === 'master_guide'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Master Research Guide (22 Sec)</span>
          </button>

        </div>

        <div className="text-[11px] text-slate-400 hidden lg:block pr-2">
          Active: <strong className="text-white capitalize">{activeResearchTab.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* 3. Sub-Lab Dynamic Content */}
      <div className="space-y-6">
        {activeResearchTab === 'theory_math' && (
          <div className="space-y-6 animate-fadeIn">
            <ResearchTheory />
          </div>
        )}

        {activeResearchTab === 'voronoi_geometry' && (
          <div className="space-y-6 animate-fadeIn">
            <VoronoiLab />
            <CoverageVoronoiDualPanel />
          </div>
        )}

        {activeResearchTab === 'coverage_matrix' && (
          <div className="space-y-6 animate-fadeIn">
            <CoverageMatrixLab />
            <CoverageAnalytics />
          </div>
        )}

        {activeResearchTab === 'source_code' && (
          <div className="space-y-6 animate-fadeIn">
            <SourceCodeViewer />
          </div>
        )}

        {activeResearchTab === 'master_guide' && (
          <div className="space-y-6 animate-fadeIn">
            <MasterGuideViewer />
          </div>
        )}
      </div>

    </div>
  );
};
