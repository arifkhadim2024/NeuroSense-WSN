import React, { useState } from 'react';
import { 
  BookOpen, Code2, FileText, Activity 
} from 'lucide-react';
import { ResearchTheory } from './ResearchTheory';
import { BenchmarkLab } from './BenchmarkLab';
import { SourceCodeViewer } from './SourceCodeViewer';
import { MasterGuideViewer } from './MasterGuideViewer';

export const ResearchView: React.FC = () => {
  const [activeResearchTab, setActiveResearchTab] = useState<'theory' | 'benchmarks' | 'source_code' | 'master_guide'>('theory');

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0D1626] p-2.5 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveResearchTab('theory')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeResearchTab === 'theory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mathematical Model</span>
          </button>

          <button
            onClick={() => setActiveResearchTab('benchmarks')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeResearchTab === 'benchmarks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Benchmark Matrix</span>
          </button>

          <button
            onClick={() => setActiveResearchTab('source_code')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeResearchTab === 'source_code'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Source Code</span>
          </button>

          <button
            onClick={() => setActiveResearchTab('master_guide')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeResearchTab === 'master_guide'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Master Technical Guide (22 Sections)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Research Repository: <strong className="text-white capitalize">{activeResearchTab.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* Dynamic Subtab Content */}
      <div className="space-y-6">
        {activeResearchTab === 'theory' && <ResearchTheory />}
        {activeResearchTab === 'benchmarks' && <BenchmarkLab />}
        {activeResearchTab === 'source_code' && <SourceCodeViewer />}
        {activeResearchTab === 'master_guide' && <MasterGuideViewer />}
      </div>

    </div>
  );
};
