import React, { useState } from 'react';
import { 
  Radio, ShieldCheck, Network, Zap 
} from 'lucide-react';
import { WSN3DVisualizer } from './WSN3DVisualizer';
import { CoverageLab } from './CoverageLab';
import { ClusteringLab } from './ClusteringLab';
import { RoutingLab } from './RoutingLab';
import { soundFX } from '../utils/soundEffects';

export const NetworkView: React.FC = () => {
  const [activeNetworkTab, setActiveNetworkTab] = useState<'topology' | 'coverage' | 'clusters' | 'routing'>('topology');

  const handleTabChange = (tab: 'topology' | 'coverage' | 'clusters' | 'routing') => {
    soundFX.playClickSound();
    setActiveNetworkTab(tab);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0D1626] p-2.5 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl shadow-cyan-950/20">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange('topology')}
            onMouseEnter={() => soundFX.playHoverSound()}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeNetworkTab === 'topology'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1220]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>3D Topology</span>
          </button>

          <button
            onClick={() => handleTabChange('coverage')}
            onMouseEnter={() => soundFX.playHoverSound()}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeNetworkTab === 'coverage'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1220]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Coverage &amp; Multiplicity</span>
          </button>

          <button
            onClick={() => handleTabChange('clusters')}
            onMouseEnter={() => soundFX.playHoverSound()}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeNetworkTab === 'clusters'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1220]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Cluster Formation</span>
          </button>

          <button
            onClick={() => handleTabChange('routing')}
            onMouseEnter={() => soundFX.playHoverSound()}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 font-bold ${
              activeNetworkTab === 'routing'
                ? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1220]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Routing Protocols</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Network View: <strong className="text-cyan-400 capitalize">{activeNetworkTab}</strong>
        </div>
      </div>

      {/* Dynamic Subtab Content */}
      <div className="space-y-6">
        {activeNetworkTab === 'topology' && <WSN3DVisualizer />}
        {activeNetworkTab === 'coverage' && <CoverageLab />}
        {activeNetworkTab === 'clusters' && <ClusteringLab />}
        {activeNetworkTab === 'routing' && <RoutingLab />}
      </div>

    </div>
  );
};
