import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Zap, Sliders, Activity 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import type { RoutingProtocol } from '../types/wsn';

export const RoutingLab: React.FC = () => {
  const { 
    selectedProtocol, 
    setSelectedProtocol, 
    nodes, 
    activeClusterHeads, 
    activeScenario, 
    telemetry,
    stepForward 
  } = useWSNSimulation();

  const [isCycleRunning, setIsCycleRunning] = useState<boolean>(false);
  const [animatedHop, setAnimatedHop] = useState<number>(0);
  const [sinkYPos, setSinkYPos] = useState<number>(activeScenario.sinkY || 150);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;

  // Execute Routing Cycle Animation
  const executeRoutingCycle = () => {
    setIsCycleRunning(true);
    setAnimatedHop(0);

    let hop = 0;
    const interval = setInterval(() => {
      hop++;
      setAnimatedHop(hop);
      if (hop >= 4) {
        clearInterval(interval);
        setIsCycleRunning(false);
        stepForward(1); // Advance simulation by 1 round
      }
    }, 400);
  };

  // Protocols metadata
  const protocols = [
    {
      id: 'pso_hybrid',
      name: 'Proposed ANN + PSO-Hybrid',
      type: 'Neural-Evolutionary',
      fnd: 425,
      hnd: 1000,
      packets: '48,109 (Optimal)',
      energyPerRnd: '0.00142 J',
      hops: '2-Hop Chain-to-CH',
      desc: 'ANN sleep pruning + Multi-objective PSO CH selection + nearest-neighbor intra-cluster chains.'
    },
    {
      id: 'hybrid',
      name: 'Standard Hybrid LEACH-PEGASIS',
      type: 'Cluster-Chain Hybrid',
      fnd: 180,
      hnd: 720,
      packets: '62,400',
      energyPerRnd: '0.00215 J',
      hops: '2-Hop Static Clusters',
      desc: 'Static spatial cluster partitioning with token-passing chain propagation to leaders.'
    },
    {
      id: 'pegasis',
      name: 'Classical PEGASIS',
      type: 'Global Chain',
      fnd: 280,
      hnd: 910,
      packets: '55,300',
      energyPerRnd: '0.00198 J',
      hops: 'Multi-Hop Global Chain',
      desc: 'Greedy global nearest-neighbor chain passing tokens to an elected rotating leader node.'
    },
    {
      id: 'leach',
      name: 'Classical LEACH',
      type: 'Probabilistic Hierarchical',
      fnd: 144,
      hnd: 852,
      packets: '71,520 (High Redundancy)',
      energyPerRnd: '0.00340 J',
      hops: '1-Hop Direct to CH',
      desc: 'Distributed probabilistic CH selection with direct long-range member-to-CH transmissions.'
    }
  ];

  // 2D Canvas Protocol Simulator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;

    ctx.clearRect(0, 0, width, height);

    // Midnight Blue Background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    // Coordinate Grid
    ctx.strokeStyle = 'rgba(28, 49, 80, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, height);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(width, y * scaleY);
      ctx.stroke();
    }

    const aliveNodes = nodes.filter((n) => n.isAlive);
    const activeNodes = aliveNodes.filter((n) => selectedProtocol === 'pso_hybrid' ? n.final_state === 'ACTIVE' : true);
    const chNodes = activeNodes.filter((n) => activeClusterHeads.includes(n.node_id));

    const bsX = (activeScenario.sinkX / W) * width;
    const bsY = 20; // Top of canvas

    // Draw Communication links
    if (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'hybrid') {
      // Intra-cluster links
      activeNodes.forEach((node) => {
        if (!activeClusterHeads.includes(node.node_id) && chNodes.length > 0) {
          const nx = node.x * scaleX;
          const ny = (H - node.y) * scaleY;
          let closestCH = chNodes[0];
          let minD = Infinity;

          chNodes.forEach((ch) => {
            const d = (node.x - ch.x) ** 2 + (node.y - ch.y) ** 2;
            if (d < minD) {
              minD = d;
              closestCH = ch;
            }
          });

          ctx.strokeStyle = animatedHop >= 1 ? 'rgba(0, 229, 255, 0.8)' : 'rgba(0, 229, 255, 0.25)';
          ctx.lineWidth = animatedHop >= 1 ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(closestCH.x * scaleX, (H - closestCH.y) * scaleY);
          ctx.stroke();
        }
      });

      // CH to Sink links
      chNodes.forEach((ch) => {
        ctx.strokeStyle = animatedHop >= 2 ? 'rgba(245, 158, 11, 0.95)' : 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = animatedHop >= 2 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(ch.x * scaleX, (H - ch.y) * scaleY);
        ctx.lineTo(bsX, bsY);
        ctx.stroke();
      });
    } else if (selectedProtocol === 'pegasis') {
      // Global chain
      for (let i = 0; i < activeNodes.length - 1; i++) {
        const n1 = activeNodes[i];
        const n2 = activeNodes[i + 1];
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(n1.x * scaleX, (H - n1.y) * scaleY);
        ctx.lineTo(n2.x * scaleX, (H - n2.y) * scaleY);
        ctx.stroke();
      }
      if (activeNodes.length > 0) {
        const leader = activeNodes[0];
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leader.x * scaleX, (H - leader.y) * scaleY);
        ctx.lineTo(bsX, bsY);
        ctx.stroke();
      }
    } else {
      // LEACH: Direct to CH
      activeNodes.forEach((node) => {
        if (!activeClusterHeads.includes(node.node_id) && chNodes.length > 0) {
          const closestCH = chNodes[node.node_id % chNodes.length];
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x * scaleX, (H - node.y) * scaleY);
          ctx.lineTo(closestCH.x * scaleX, (H - closestCH.y) * scaleY);
          ctx.stroke();
        }
      });
      chNodes.forEach((ch) => {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ch.x * scaleX, (H - ch.y) * scaleY);
        ctx.lineTo(bsX, bsY);
        ctx.stroke();
      });
    }

    // Draw Sensor Nodes
    nodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      const isCH = activeClusterHeads.includes(node.node_id);

      if (!node.isAlive) {
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isCH) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (selectedProtocol === 'pso_hybrid' && node.final_state === 'SLEEP') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = node.node_type === 'super' ? '#8B5CF6' : node.node_type === 'advanced' ? '#10B981' : '#00E5FF';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Base Station
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(bsX, bsY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bsX, bsY, 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('BASE STATION', bsX + 20, bsY + 3);

  }, [nodes, activeClusterHeads, selectedProtocol, animatedHop, activeScenario, W, H]);

  const activeProtoMeta = protocols.find((p) => p.id === selectedProtocol) || protocols[0];

  return (
    <section id="routing-lab" className="py-12 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <Radio className="w-3.5 h-3.5" />
            Routing Protocol Control Center
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
            Multi-Hop Transmission &amp; Routing Dynamics
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Comparing LEACH, PEGASIS, Hybrid, and Proposed PSO-Hybrid data aggregation chains, multi-hop transmission dissipation, and packet delivery throughput.
          </p>
        </div>

        {/* Protocol Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {protocols.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProtocol(p.id as RoutingProtocol)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedProtocol === p.id
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                  : 'bg-[#0D1626] border-[#1C3150] hover:border-cyan-500/30 text-slate-400'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase">{p.type}</span>
                  {selectedProtocol === p.id && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{p.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3">{p.desc}</p>
              </div>

              <div className="pt-2 border-t border-[#1C3150] text-[11px] flex justify-between text-slate-300">
                <span>FND: <strong className="text-violet-300">{p.fnd} Rnds</strong></span>
                <span>Dissipation: <strong className="text-cyan-400">{p.energyPerRnd}</strong></span>
              </div>
            </button>
          ))}
        </div>

        {/* Interactive Simulator & Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lab-card rounded-3xl p-5 border border-[#1C3150] bg-[#0D1626] flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1C3150] font-mono text-xs">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                Live Multi-Hop Transmission Stream ({activeProtoMeta.name})
              </span>
              <button
                onClick={executeRoutingCycle}
                disabled={isCycleRunning}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25 flex items-center gap-1.5 hover:opacity-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isCycleRunning ? 'ROUTING IN PROGRESS...' : 'EXECUTE ROUTING CYCLE'}</span>
              </button>
            </div>

            <div className="relative aspect-square max-h-[460px] mx-auto w-full bg-[#070B14] rounded-2xl border border-[#1C3150] p-2 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="w-full h-full max-h-[440px] max-w-[440px] rounded-xl"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-[#1C3150] font-mono text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="text-amber-300 font-semibold">{activeClusterHeads.length} Active Cluster Heads</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500"></span>
                <span className="text-cyan-300">Intra-Cluster Chaining Links</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <span className="text-amber-300">Long-Range Sink Transmission</span>
              </div>
            </div>
          </div>

          {/* Right Live Routing Telemetry */}
          <div className="space-y-4 font-mono text-xs">
            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Routing Cycle Telemetry</span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Packets Delivered:</span>
                  <span className="font-bold text-cyan-300">{telemetry.packetsReceived.toLocaleString()} pkts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Success Ratio:</span>
                  <span className="font-bold text-emerald-400">{telemetry.deliveryRatio.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Hop Topology:</span>
                  <span className="font-bold text-white">{activeProtoMeta.hops}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Dissipation / Round:</span>
                  <span className="font-bold text-violet-300">{activeProtoMeta.energyPerRnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stability Limit (FND):</span>
                  <span className="font-bold text-emerald-400">Round {activeProtoMeta.fnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Half Nodes Dead (HND):</span>
                  <span className="font-bold text-amber-400">Round {activeProtoMeta.hnd}</span>
                </div>
              </div>
            </div>

            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Base Station Sink Placement</span>
              </div>
              <div className="p-3 bg-[#070B14] rounded-xl border border-[#1C3150] space-y-2">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Sink Y Coordinate:</span>
                  <span className="text-cyan-300 font-bold">({activeScenario.sinkX}, {sinkYPos}m)</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={250}
                  value={sinkYPos}
                  onChange={(e) => setSinkYPos(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Moving sink away from sensing field stresses free-space (d²) vs multipath (d⁴) threshold boundary (d0 ≈ 87.7 meters).
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
