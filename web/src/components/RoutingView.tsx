import React, { useState } from 'react';
import { 
  GitBranch, Zap, Cpu, Clock
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { RoutingProtocolsLab } from './RoutingProtocolsLab';
import { RoutingLab } from './RoutingLab';
import { EnergyLifetimeLab } from './EnergyLifetimeLab';
import { EnergyAnalytics } from './EnergyAnalytics';
import { soundFX } from '../utils/soundEffects';

export const RoutingView: React.FC = () => {
  const { selectedProtocol } = useWSNSimulation();
  const [activeRoutingTab, setActiveRoutingTab] = useState<'protocols_lab' | 'routing_graph' | 'energy_lifetime' | 'radio_analytics'>('protocols_lab');

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* 1. Header explaining Energy-Aware Routing Protocols */}
      <div className="text-center max-w-4xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <GitBranch className="w-3.5 h-3.5" />
          Energy-Aware Routing Layer
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-mono">
          LEACH, PEGASIS, Hybrid &amp; PSO-Hybrid Protocols
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
          Once the sensor placement is spatially optimized to eliminate redundant overlap, the network routes environmental data toward the Sink using energy-aware Cluster Heads and multi-hop paths governed by the First-Order Radio Model.
        </p>
      </div>

      {/* 2. Sub-Lab Switcher Tabs */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0D1626] p-2 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          
          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveRoutingTab('protocols_lab');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeRoutingTab === 'protocols_lab'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>4 Protocols Comparison (LEACH/PEGASIS/Hybrid/PSO)</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveRoutingTab('routing_graph');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeRoutingTab === 'routing_graph'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <GitBranch className="w-4 h-4 text-violet-300" />
            <span>Multi-Hop Topology &amp; CH Election</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveRoutingTab('energy_lifetime');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeRoutingTab === 'energy_lifetime'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Battery Depletion &amp; Lifetime</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setActiveRoutingTab('radio_analytics');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 font-bold cursor-pointer shrink-0 ${
              activeRoutingTab === 'radio_analytics'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#070B14]'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Radio Dissipation Analytics</span>
          </button>

        </div>

        <div className="text-[11px] text-slate-400 hidden lg:block pr-2">
          Active Protocol: <strong className="text-cyan-300 uppercase">{selectedProtocol.replace('_', '-')}</strong>
        </div>
      </div>

      {/* 3. Sub-Lab Dynamic Content */}
      <div className="space-y-6">
        {activeRoutingTab === 'protocols_lab' && (
          <div className="space-y-6 animate-fadeIn">
            <RoutingProtocolsLab />
          </div>
        )}

        {activeRoutingTab === 'routing_graph' && (
          <div className="space-y-6 animate-fadeIn">
            <RoutingLab />
          </div>
        )}

        {activeRoutingTab === 'energy_lifetime' && (
          <div className="space-y-6 animate-fadeIn">
            <EnergyLifetimeLab />
          </div>
        )}

        {activeRoutingTab === 'radio_analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <EnergyAnalytics />
          </div>
        )}
      </div>

    </div>
  );
};
