import React, { useState } from 'react';
import { 
  X, Layers, Sliders, CheckCircle2, 
  RotateCcw, Save 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import type { ScenarioConfig, RoutingProtocol, OptimizationAlgorithm } from '../types/wsn';

export const ScenarioManagerModal: React.FC = () => {
  const { 
    isScenarioModalOpen, 
    setIsScenarioModalOpen, 
    activeScenario, 
    allScenarios, 
    selectScenario, 
    saveCustomScenario, 
    resetScenario 
  } = useWSNSimulation();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom scenario builder state
  const [customConfig, setCustomConfig] = useState<ScenarioConfig>({
    id: `custom_${Date.now()}`,
    name: 'Custom WSN Scenario',
    category: 'custom',
    description: 'User-configured custom research scenario with tailored spatial and energy parameters.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 42
  });

  if (!isScenarioModalOpen) return null;

  const handleSaveAndApply = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomScenario(customConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0D1626] border border-[#1C3150] rounded-3xl shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col font-mono text-xs">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#070B14] border-b border-[#1C3150] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Scenario Manager &amp; Custom Benchmark Suite
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                  v2.0 Configurator
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Switch research benchmark topologies or configure custom parameters with synchronized physics.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScenarioModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#0B1220] rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#1C3150] bg-[#070B14] px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Preset Research Scenarios ({allScenarios.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Scenario Builder</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 bg-[#090F1C]">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allScenarios.map((sc) => {
                const isCurrent = activeScenario.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => selectScenario(sc.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#0D1626] border-[#1C3150] hover:border-cyan-500/30 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          sc.category === 'benchmark' 
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
                            : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                        }`}>
                          {sc.category}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1.5">{sc.name}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {sc.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1C3150] text-[11px] text-slate-300">
                      <div>Nodes: <strong className="text-white">{sc.sensorCount}</strong></div>
                      <div>Field: <strong className="text-cyan-300">{sc.fieldWidth}x{sc.fieldHeight}m</strong></div>
                      <div>Energy E0: <strong className="text-emerald-400">{sc.initialEnergy} J</strong></div>
                      <div>Radius Rs: <strong className="text-violet-300">{sc.sensingRadius} m</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSaveAndApply} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Scenario Name</label>
                  <input
                    type="text"
                    value={customConfig.name}
                    onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Sensor Distribution Pattern</label>
                  <select
                    value={customConfig.distribution}
                    onChange={(e) => setCustomConfig({ ...customConfig, distribution: e.target.value as any })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="random">Random Uniform (Standard)</option>
                    <option value="uniform">Deterministic Uniform Grid</option>
                    <option value="clustered">Multi-Hotspot Clustered</option>
                    <option value="grid">Strict Matrix Grid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Sensor Count (N)</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={customConfig.sensorCount}
                    onChange={(e) => setCustomConfig({ ...customConfig, sensorCount: Number(e.target.value) })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Field Size (W x H meters)</label>
                  <input
                    type="number"
                    min={50}
                    max={300}
                    value={customConfig.fieldWidth}
                    onChange={(e) => setCustomConfig({ ...customConfig, fieldWidth: Number(e.target.value), fieldHeight: Number(e.target.value) })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Sensing Radius (Rs meters)</label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={customConfig.sensingRadius}
                    onChange={(e) => setCustomConfig({ ...customConfig, sensingRadius: Number(e.target.value) })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Initial Energy (E0 Joules)</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0.1}
                    max={5.0}
                    value={customConfig.initialEnergy}
                    onChange={(e) => setCustomConfig({ ...customConfig, initialEnergy: Number(e.target.value) })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Base Station Coordinate (X, Y)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={customConfig.sinkX}
                      onChange={(e) => setCustomConfig({ ...customConfig, sinkX: Number(e.target.value) })}
                      placeholder="X"
                      className="w-1/2 bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <input
                      type="number"
                      value={customConfig.sinkY}
                      onChange={(e) => setCustomConfig({ ...customConfig, sinkY: Number(e.target.value) })}
                      placeholder="Y"
                      className="w-1/2 bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Routing Protocol</label>
                  <select
                    value={customConfig.routingProtocol}
                    onChange={(e) => setCustomConfig({ ...customConfig, routingProtocol: e.target.value as RoutingProtocol })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="pso_hybrid">Proposed ANN + PSO-Hybrid</option>
                    <option value="hybrid">Standard Hybrid LEACH-PEGASIS</option>
                    <option value="pegasis">Classical PEGASIS Chain</option>
                    <option value="leach">Classical LEACH Hierarchy</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Optimization Algorithm</label>
                  <select
                    value={customConfig.optimizationAlgorithm}
                    onChange={(e) => setCustomConfig({ ...customConfig, optimizationAlgorithm: e.target.value as OptimizationAlgorithm })}
                    className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="ann_greedy">ANN Prediction + Greedy Sleep Pruning</option>
                    <option value="pso">Pure Particle Swarm Optimization</option>
                    <option value="mopso">Multi-Objective PSO</option>
                    <option value="none">No Sleep Scheduling (Baseline 100%)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => resetScenario()}
                  className="px-4 py-2.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Standard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25 hover:opacity-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save &amp; Deploy Scenario
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#070B14] border-t border-[#1C3150] flex justify-between items-center text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Current Active: <strong className="text-white">{activeScenario.name}</strong></span>
          </div>
          <button
            onClick={() => setIsScenarioModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#0B1220] border border-[#1C3150] text-slate-300 hover:text-white"
          >
            Close Configurator
          </button>
        </div>

      </div>
    </div>
  );
};
