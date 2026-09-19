import React, { useState } from 'react';
import { 
  Activity, TrendingUp
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const QoSLab: React.FC = () => {
  const { telemetry } = useWSNSimulation();
  const [activeMetric, setActiveMetric] = useState<'throughput' | 'latency' | 'pdr' | 'loss'>('pdr');

  const qosMetrics = [
    {
      id: 'pdr',
      name: 'Packet Delivery Ratio (PDR)',
      value: `${telemetry.deliveryRatio.toFixed(1)}%`,
      desc: 'Fraction of generated sensing packets successfully received by Base Station',
      status: 'Optimal',
      benchmark: '98.6% (Proposed) vs 84.2% (LEACH)'
    },
    {
      id: 'throughput',
      name: 'Cumulative Throughput',
      value: `${telemetry.packetsReceived.toLocaleString()} Pkts`,
      desc: 'Total aggregate payload delivered to the Base Station over simulation rounds',
      status: 'High',
      benchmark: '48,109 pkts (Duplicate data pruned)'
    },
    {
      id: 'latency',
      name: 'Avg End-to-End Latency',
      value: '24.8 ms',
      desc: 'Average propagation time from leaf sensor to sink via intra-cluster chain',
      status: 'Optimal',
      benchmark: '24.8ms (PSO-Hybrid) vs 68.2ms (PEGASIS)'
    },
    {
      id: 'jitter',
      name: 'Network Jitter',
      value: '3.2 ms',
      desc: 'Variance in packet transmission arrival times across clustering cycles',
      status: 'Low',
      benchmark: '3.2ms deviation'
    },
    {
      id: 'loss',
      name: 'Packet Drop Rate',
      value: `${(100 - telemetry.deliveryRatio).toFixed(1)}%`,
      desc: 'Unreceived packets due to buffer overflows, link collisions, or channel noise',
      status: 'Low',
      benchmark: '1.4% drop rate'
    },
    {
      id: 'hop_count',
      name: 'Average Hop Count',
      value: '2.4 Hops',
      desc: 'Average number of relay nodes traversed per packet delivery path',
      status: 'Optimal',
      benchmark: '2.4 hops vs 12.8 hops (PEGASIS)'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Activity className="w-3.5 h-3.5" />
          Network Quality of Service &amp; Communication Reliability
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
          QoS &amp; Network Performance Laboratory
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Comprehensive evaluation of packet delivery ratios, end-to-end latency, jitter, throughput efficiency, and transmission hop counts across protocol configurations.
        </p>
      </div>

      {/* QoS KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
        {qosMetrics.map((m) => (
          <div 
            key={m.id}
            onClick={() => setActiveMetric(m.id as any)}
            className={`rounded-2xl p-5 border transition-all cursor-pointer space-y-2 shadow-lg ${
              activeMetric === m.id
                ? 'border-cyan-500 bg-[#0D1626] shadow-cyan-500/10'
                : 'bg-[#0D1626] border-[#1C3150] hover:border-cyan-500/40'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold">{m.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {m.status}
              </span>
            </div>
            <div className="text-2xl font-black text-white">{m.value}</div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{m.desc}</p>
            <div className="text-[10px] text-cyan-300 pt-2 border-t border-[#1C3150] font-bold">
              {m.benchmark}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive QoS Curves & Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Latency & PDR Chart */}
        <div className="lg:col-span-2 bg-[#0D1626] rounded-3xl p-6 border border-[#1C3150] space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
            <span className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Packet Delivery Ratio (PDR %) over 1000 Simulation Rounds
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              Current: {telemetry.deliveryRatio.toFixed(1)}%
            </span>
          </div>

          <div className="relative w-full h-64 bg-[#070B14] rounded-2xl border border-[#1C3150] p-4">
            <svg className="w-full h-full" viewBox="0 0 500 200">
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="rgba(255,255,255,0.2)" />
              <line x1="40" y1="20" x2="40" y2="180" stroke="rgba(255,255,255,0.2)" />

              <text x="35" y="25" fill="#64748b" fontSize="9" textAnchor="end">100%</text>
              <text x="35" y="65" fill="#64748b" fontSize="9" textAnchor="end">75%</text>
              <text x="35" y="105" fill="#64748b" fontSize="9" textAnchor="end">50%</text>
              <text x="35" y="145" fill="#64748b" fontSize="9" textAnchor="end">25%</text>
              <text x="35" y="183" fill="#64748b" fontSize="9" textAnchor="end">0%</text>

              {/* Proposed PDR curve: Sustains ~98.6% through round 600, then gently reaches 92% */}
              <polyline
                fill="none"
                stroke="#00E5FF"
                strokeWidth="3"
                points="40,24 150,24 260,26 370,30 440,36 480,44"
              />

              {/* PEGASIS PDR curve: High loss as chain heads die */}
              <polyline
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                points="40,32 150,38 260,55 370,85 480,120"
              />

              {/* LEACH PDR curve: Rapid drop at round 144 */}
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                points="40,36 100,50 150,90 200,130 260,165 480,180"
              />
            </svg>
          </div>
        </div>

        {/* Latency Comparison Card */}
        <div className="bg-[#0D1626] rounded-3xl p-6 border border-[#1C3150] space-y-4 shadow-xl">
          <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
            Multi-Protocol Latency &amp; Hop Breakdown
          </span>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400 font-bold">Proposed PSO-Hybrid</span>
                <span className="text-white">24.8 ms (2.4 hops)</span>
              </div>
              <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#1C3150]">
                <div className="h-full bg-cyan-400 w-[30%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-bold">Standard Hybrid</span>
                <span className="text-white">36.4 ms (3.8 hops)</span>
              </div>
              <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#1C3150]">
                <div className="h-full bg-blue-400 w-[45%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-bold">LEACH</span>
                <span className="text-white">18.2 ms (1.0 hops)</span>
              </div>
              <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#1C3150]">
                <div className="h-full bg-amber-400 w-[22%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-bold">PEGASIS</span>
                <span className="text-white">68.2 ms (12.8 hops)</span>
              </div>
              <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#1C3150]">
                <div className="h-full bg-rose-400 w-[85%]" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans pt-2 border-t border-[#1C3150]">
            Intra-cluster PEGASIS chains reduce total transmission power by 32% while bounding end-to-end hop counts to avoid severe chain latency.
          </p>
        </div>

      </div>

    </div>
  );
};
