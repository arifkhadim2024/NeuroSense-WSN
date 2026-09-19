import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Zap, ShieldCheck, 
  Battery, Radio
} from 'lucide-react';

export const ResearchTheory: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'radio' | 'coverage' | 'pso' | 'heterogeneous'>('radio');

  return (
    <section id="theory" className="py-16 px-4 relative border-t border-[#1C3150]/60 bg-[#050912]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
            <BookOpen className="w-3.5 h-3.5" />
            Scientific Formulations &amp; Academic Theory
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono tracking-tight">
            Mathematical Models &amp; Theoretical Framework
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Formal mathematical formulations of the First-Order Radio Model, Grid Discretization Coverage Equations, and Multi-Objective PSO Swarm Intelligence.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 mb-8 font-mono text-xs">
          <button
            onClick={() => setActiveSection('radio')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeSection === 'radio'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150] hover:border-cyan-500/40'
            }`}
          >
            1. First-Order Radio Model
          </button>
          <button
            onClick={() => setActiveSection('coverage')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeSection === 'coverage'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150] hover:border-blue-500/40'
            }`}
          >
            2. Spatial Coverage &amp; Overlap
          </button>
          <button
            onClick={() => setActiveSection('pso')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeSection === 'pso'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150] hover:border-violet-500/40'
            }`}
          >
            3. Multi-Objective PSO Fitness
          </button>
          <button
            onClick={() => setActiveSection('heterogeneous')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeSection === 'heterogeneous'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150] hover:border-amber-500/40'
            }`}
          >
            4. Heterogeneous Energy Model
          </button>
        </div>

        <div className="bg-[#0D1626] rounded-3xl p-6 sm:p-8 border border-[#1C3150] shadow-2xl shadow-cyan-950/20">
          {activeSection === 'radio' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#1C3150]">
                <div className="p-2.5 bg-cyan-500/15 rounded-xl text-cyan-400 border border-cyan-500/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    First-Order Radio Energy Dissipation Model
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Free Space (d²) and Multi-Path (d⁴) Path-Loss Channel Models
                  </p>
                </div>
              </div>

              <div className="bg-[#070B14] p-5 rounded-2xl border border-[#1C3150] space-y-3 font-mono text-xs sm:text-sm">
                <div className="text-cyan-400 font-bold">Transmitter Energy Dissipation E_Tx(k, d):</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200">
                  {'E_Tx(k, d) = k · E_elec + k · ε_fs · d²   (for d < d₀)'}<br />
                  {'E_Tx(k, d) = k · E_elec + k · ε_mp · d⁴   (for d ≥ d₀)'}
                </div>

                <div className="text-blue-400 font-bold pt-2">Receiver Energy Dissipation E_Rx(k):</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200">
                  {'E_Rx(k) = k · E_elec'}
                </div>

                <div className="text-violet-400 font-bold pt-2">Threshold Distance Crossover d₀:</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200">
                  {'d₀ = √(ε_fs / ε_mp) = √(50 × 10⁻¹² / 0.0013 × 10⁻¹¹) ≈ 87.7058 meters'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-[#070B14] p-3.5 rounded-xl border border-[#1C3150]">
                  <span className="text-slate-400 block text-[10px]">E_elec (ETX / ERX)</span>
                  <strong className="text-white text-sm">50 nJ/bit</strong>
                  <p className="text-[11px] text-slate-400 mt-1">Transmitter &amp; receiver electronics energy.</p>
                </div>
                <div className="bg-[#070B14] p-3.5 rounded-xl border border-[#1C3150]">
                  <span className="text-slate-400 block text-[10px]">ε_fs (Free Space)</span>
                  <strong className="text-white text-sm">50 pJ/bit/m²</strong>
                  <p className="text-[11px] text-slate-400 mt-1">Amplifier energy for short-distance paths.</p>
                </div>
                <div className="bg-[#070B14] p-3.5 rounded-xl border border-[#1C3150]">
                  <span className="text-slate-400 block text-[10px]">ε_mp (Multi-Path)</span>
                  <strong className="text-white text-sm">0.0013 pJ/bit/m⁴</strong>
                  <p className="text-[11px] text-slate-400 mt-1">Amplifier energy for long-distance multipath.</p>
                </div>
                <div className="bg-[#070B14] p-3.5 rounded-xl border border-[#1C3150]">
                  <span className="text-slate-400 block text-[10px]">EDA (Aggregation)</span>
                  <strong className="text-white text-sm">5 nJ/bit/signal</strong>
                  <p className="text-[11px] text-slate-400 mt-1">Data aggregation energy at cluster heads.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'coverage' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#1C3150]">
                <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    Grid Discretization Spatial Coverage &amp; Overlap Model
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    2m Coordinate Step Discretization over [0, 100] × [0, 100] m² Sensing Area
                  </p>
                </div>
              </div>

              <div className="bg-[#070B14] p-5 rounded-2xl border border-[#1C3150] space-y-3 font-mono text-xs sm:text-sm">
                <div className="text-cyan-400 font-bold">Point Coverage Indicator Function I(g, S_active):</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200 leading-relaxed">
                  {'I(g, S_active) = 1   if ∃ i ∈ S_active : ||(x_g, y_g) - (x_i, y_i)|| ≤ r_s'}<br />
                  {'I(g, S_active) = 0   otherwise'}
                </div>

                <div className="text-emerald-400 font-bold pt-2">Network Sensing Coverage Ratio Coverage(S_active):</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200">
                  {'Coverage(S_active) = [ ∑_{g=1}^M I(g, S_active) / M ] × 100%'}
                </div>

                <div className="text-amber-400 font-bold pt-2">Sensing Overlap Ratio Overlap(S_active):</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200">
                  {'Overlap(S_active) = [ ∑_{g=1}^M 𝟙( ∑_{i ∈ S} I(g, i) > 1 ) / ∑_{g=1}^M I(g, S_active) ] × 100%'}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'pso' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#1C3150]">
                <div className="p-2.5 bg-violet-500/15 rounded-xl text-violet-400 border border-violet-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    Particle Swarm Optimization (PSO) Multi-Objective Fitness
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Swarm Candidate Particle Formulation for Optimal Cluster Head Topology
                  </p>
                </div>
              </div>

              <div className="bg-[#070B14] p-5 rounded-2xl border border-[#1C3150] space-y-3 font-mono text-xs sm:text-sm">
                <div className="text-violet-400 font-bold">Composite Swarm Fitness Objective:</div>
                <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1C3150] text-slate-200 leading-relaxed text-sm">
                  {'Fitness(P) = w₁ · avg(E_CH) + w₂ · [1 / (avg(d_sink) + ε)] + w₃ · [1 / (avg(d_intra) + ε)] + w₄ · Cov(P) - w₅ · Ovl(P)'}
                </div>

                <div className="text-slate-400 text-xs pt-2">
                  Where validated weight vector: <code className="text-cyan-400">w = [2.0, 100.0, 50.0, 100.0, 50.0]</code>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'heterogeneous' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#1C3150]">
                <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-400 border border-amber-500/30">
                  <Battery className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    3-Tier Heterogeneous Energy Model
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Initial Energy Tier Partitioning: Normal, Advanced, and Super Nodes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-[#070B14] p-4 rounded-2xl border border-cyan-500/20 space-y-2">
                  <span className="text-cyan-400 font-bold uppercase text-[11px]">Normal Nodes (70%)</span>
                  <div className="text-xl font-bold text-white">E₀ = 0.5 Joules</div>
                  <p className="text-slate-400 text-[11px]">Standard sensing nodes with baseline battery capacity.</p>
                </div>

                <div className="bg-[#070B14] p-4 rounded-2xl border border-blue-500/20 space-y-2">
                  <span className="text-blue-400 font-bold uppercase text-[11px]">Advanced Nodes (20%)</span>
                  <div className="text-xl font-bold text-white">E_adv = E₀(1 + α) = 1.0 J</div>
                  <p className="text-slate-400 text-[11px]">100% additional energy capacity (α = 1.0) for intermediate routing.</p>
                </div>

                <div className="bg-[#070B14] p-4 rounded-2xl border border-violet-500/20 space-y-2">
                  <span className="text-violet-400 font-bold uppercase text-[11px]">Super Nodes (10%)</span>
                  <div className="text-xl font-bold text-white">E_sup = E₀(1 + β) = 1.5 J</div>
                  <p className="text-slate-400 text-[11px]">200% additional energy capacity (β = 2.0) prioritized as Cluster Heads.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
