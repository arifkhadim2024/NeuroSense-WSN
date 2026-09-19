import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Battery, ShieldCheck, TrendingUp, 
  Clock, Zap, Activity, Network, CheckCircle2,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export const KPICardsSection: React.FC = () => {
  const metrics = [
    {
      id: 'active_nodes',
      title: 'Active Sensor Nodes',
      value: '56.0',
      unit: 'Nodes',
      delta: '-44.00%',
      baseline: '100.0 Nodes',
      isPositive: true,
      icon: Cpu,
      accent: 'emerald',
      description: '44 redundant sensors dynamically transitioned to sleep mode, eliminating unnecessary idle radio power.'
    },
    {
      id: 'sleeping_nodes',
      title: 'Sleeping Nodes (Zero-Drain)',
      value: '44.0',
      unit: 'Nodes',
      delta: '100% Retained',
      baseline: '0.0 Nodes',
      isPositive: true,
      icon: Battery,
      accent: 'amber',
      description: 'Idle sleeping nodes do not generate or forward packets, retaining 100% of their initial battery capacity.'
    },
    {
      id: 'sensing_coverage',
      title: 'WSN Sensing Coverage',
      value: '92.73%',
      unit: 'Coverage',
      delta: 'Δ = -1.00%',
      baseline: '93.73%',
      isPositive: true,
      icon: ShieldCheck,
      accent: 'cyan',
      description: 'Coverage strictly bounded within <= 1.0 percentage point target boundary of full deployment baseline.'
    },
    {
      id: 'sensing_overlap',
      title: 'Sensing Overlap Ratio',
      value: '54.97%',
      unit: 'Overlap',
      delta: '-33.38%',
      baseline: '82.51%',
      isPositive: true,
      icon: TrendingUp,
      accent: 'emerald',
      description: 'Substantial 33.38% relative drop in redundant overlapping sensing areas across dense clusters.'
    },
    {
      id: 'fnd_stability',
      title: 'First Node Dead (FND)',
      value: '425.33',
      unit: 'Rounds',
      delta: '+194.01%',
      baseline: '144.67 Rnds',
      isPositive: true,
      icon: Clock,
      accent: 'violet',
      description: 'Network full-operational stability phase extended nearly 3-fold before first sensor battery exhaustion.'
    },
    {
      id: 'hnd_lifespan',
      title: 'Half Nodes Dead (HND)',
      value: '1000.0',
      unit: 'Rounds',
      delta: '+17.37%',
      baseline: '852.00 Rnds',
      isPositive: true,
      icon: Zap,
      accent: 'cyan',
      description: 'Over 50% of sensors survived throughout the entire 1000-round simulation across all 3 test seeds.'
    },
    {
      id: 'runtime_speedup',
      title: 'Simulation Execution Time',
      value: '128.06',
      unit: 'Seconds',
      delta: '-49.32%',
      baseline: '252.69 s',
      isPositive: true,
      icon: Activity,
      accent: 'emerald',
      description: 'Compact active routing graph accelerates PSO candidate space search and intra-cluster chaining.'
    },
    {
      id: 'throughput_tradeoff',
      title: 'Delivered Throughput',
      value: '48,109',
      unit: 'Packets',
      delta: '-32.73%',
      baseline: '71,520 Pkts',
      isPositive: false,
      icon: Network,
      accent: 'rose',
      description: 'Intentional engineering trade-off: sleeping nodes eliminate duplicate packet sensing at the source.'
    }
  ];

  return (
    <section id="metrics" className="py-16 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Empirical Research Metrics
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono">
            3-Seed Experimental Research Benchmarks
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Statistically validated metrics computed over 1000 simulation rounds across independent random spatial deployments (Seeds 42, 123, and 456).
          </p>
        </div>

        {/* 8 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            const isEmerald = m.accent === 'emerald';
            const isCyan = m.accent === 'cyan';
            const isViolet = m.accent === 'violet';
            const isAmber = m.accent === 'amber';

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-[#0D1626] rounded-2xl p-5 border border-[#1C3150] transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:border-cyan-500/40"
              >
                {/* Header Icon & Delta Badge */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isEmerald ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    isCyan ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                    isViolet ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    isAmber ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                    m.isPositive
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                    {m.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {m.delta}
                  </span>
                </div>

                {/* Metric Title */}
                <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {m.title}
                </h3>

                {/* Primary Number */}
                <div className="flex items-baseline space-x-1.5 mb-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {m.unit}
                  </span>
                </div>

                {/* Baseline Comparison */}
                <div className="text-[11px] font-mono text-slate-400 pb-2 border-b border-[#1C3150] mb-2">
                  Baseline: <span className="text-slate-300 font-semibold">{m.baseline}</span>
                </div>

                {/* Detailed Explanation */}
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {m.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
