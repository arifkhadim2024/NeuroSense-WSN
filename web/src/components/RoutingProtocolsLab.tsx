import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Zap, Cpu
} from 'lucide-react';
import type { RoutingProtocol } from '../types/wsn';

interface Node {
  id: number;
  x: number;
  y: number;
  E: number;
  maxE: number;
  type: 'normal' | 'advanced' | 'super';
  isCH: boolean;
}

export const RoutingProtocolsLab: React.FC = () => {
  // Parameters
  const [numNodes, setNumNodes] = useState<number>(100);
  const [initialEnergy, setInitialEnergy] = useState<number>(0.5);
  const [protocol, setProtocol] = useState<RoutingProtocol>('pso_hybrid');
  const [isHeterogeneous, setIsHeterogeneous] = useState<boolean>(true);
  const [sinkPos, setSinkPos] = useState<{ x: number; y: number }>({ x: 50, y: 150 });
  const [speed, setSpeed] = useState<number>(40); // ms per round

  // Simulation State
  const [round, setRound] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [aliveCount, setAliveCount] = useState<number>(numNodes);
  const [avgEnergy, setAvgEnergy] = useState<number>(initialEnergy);
  const [throughput, setThroughput] = useState<number>(0);

  // Lifecycle Milestones
  const [fnd, setFnd] = useState<number | null>(null);

  // Dynamic Visual Connections
  const [chConnections, setChConnections] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } }[]>([]);
  const [chainConnections, setChainConnections] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Network Nodes
  const resetNetwork = () => {
    setIsRunning(false);
    setRound(0);
    setThroughput(0);
    setFnd(null);
    setChConnections([]);
    setChainConnections([]);

    const newNodes: Node[] = [];
    const numAdv = isHeterogeneous ? Math.floor(numNodes * 0.2) : 0;
    const numSup = isHeterogeneous ? Math.floor(numNodes * 0.1) : 0;

    for (let i = 0; i < numNodes; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      let type: 'normal' | 'advanced' | 'super' = 'normal';
      let e = initialEnergy;

      if (isHeterogeneous) {
        if (i < numSup) {
          type = 'super';
          e = initialEnergy * 3.0;
        } else if (i < numSup + numAdv) {
          type = 'advanced';
          e = initialEnergy * 2.0;
        }
      }

      newNodes.push({
        id: i,
        x,
        y,
        E: e,
        maxE: e,
        type,
        isCH: false,
      });
    }

    setNodes(newNodes);
    setAliveCount(numNodes);
    const totalE = newNodes.reduce((acc, n) => acc + n.E, 0);
    setAvgEnergy(totalE / numNodes);
  };

  useEffect(() => {
    resetNetwork();
  }, [numNodes, initialEnergy, isHeterogeneous]);

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  const stepSimulation = () => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((n) => ({ ...n, isCH: false }));
      const aliveIndices = updatedNodes.map((n, i) => (n.E > 0 ? i : -1)).filter((i) => i !== -1);
      const currentAliveCount = aliveIndices.length;

      if (currentAliveCount === 0) {
        setIsRunning(false);
        return updatedNodes;
      }

      if (fnd === null && currentAliveCount < numNodes) setFnd(round);

      let roundPackets = 0;
      const newChConns: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
      const newChainConns: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];

      if (protocol === 'leach' || protocol === 'hybrid' || protocol === 'pso_hybrid') {
        const numCH = Math.max(1, Math.floor(0.05 * currentAliveCount));
        let chIndices: number[] = [];

        if (protocol === 'pso_hybrid') {
          const sorted = [...aliveIndices].sort((a, b) => {
            const scoreA = updatedNodes[a].E * 2.5 - dist(updatedNodes[a], sinkPos) * 0.04;
            const scoreB = updatedNodes[b].E * 2.5 - dist(updatedNodes[b], sinkPos) * 0.04;
            return scoreB - scoreA;
          });
          chIndices = sorted.slice(0, numCH);
        } else {
          const shuffled = [...aliveIndices].sort(() => Math.random() - 0.5);
          chIndices = shuffled.slice(0, numCH);
        }

        chIndices.forEach((idx) => {
          updatedNodes[idx].isCH = true;
        });

        chIndices.forEach((chIdx) => {
          const chNode = updatedNodes[chIdx];
          const members = aliveIndices.filter(
            (idx) => !chIndices.includes(idx) && dist(updatedNodes[idx], chNode) <= 45
          );

          if (protocol === 'hybrid' || protocol === 'pso_hybrid') {
            let chain = [...members];
            if (chain.length > 0) {
              let curr = chain.shift()!;
              while (chain.length > 0) {
                let nextIdx = 0;
                let minDist = dist(updatedNodes[curr], updatedNodes[chain[0]]);
                for (let i = 1; i < chain.length; i++) {
                  const d = dist(updatedNodes[curr], updatedNodes[chain[i]]);
                  if (d < minDist) {
                    minDist = d;
                    nextIdx = i;
                  }
                }
                const next = chain.splice(nextIdx, 1)[0];
                newChainConns.push({ from: updatedNodes[curr], to: updatedNodes[next] });
                
                updatedNodes[curr].E = Math.max(0, updatedNodes[curr].E - 0.0007);
                updatedNodes[next].E = Math.max(0, updatedNodes[next].E - 0.00035);
                roundPackets++;
                curr = next;
              }
            }
          } else {
            members.forEach((mIdx) => {
              const mNode = updatedNodes[mIdx];
              newChConns.push({ from: mNode, to: chNode });
              updatedNodes[mIdx].E = Math.max(0, updatedNodes[mIdx].E - 0.0009);
              chNode.E = Math.max(0, chNode.E - 0.00045);
              roundPackets++;
            });
          }

          const dSink = dist(chNode, sinkPos);
          const txEnergy = dSink > 75 ? 0.0028 : 0.0014;
          chNode.E = Math.max(0, chNode.E - txEnergy);
          roundPackets += 2;
        });

      } else if (protocol === 'pegasis') {
        let chain = [...aliveIndices];
        if (chain.length > 0) {
          chain.sort((a, b) => dist(updatedNodes[b], sinkPos) - dist(updatedNodes[a], sinkPos));
          for (let i = 0; i < chain.length - 1; i++) {
            const u = chain[i];
            const v = chain[i + 1];
            newChainConns.push({ from: updatedNodes[u], to: updatedNodes[v] });
            updatedNodes[u].E = Math.max(0, updatedNodes[u].E - 0.00055);
            updatedNodes[v].E = Math.max(0, updatedNodes[v].E - 0.00028);
            roundPackets++;
          }
          const leader = chain[round % chain.length];
          updatedNodes[leader].isCH = true;
          const dSink = dist(updatedNodes[leader], sinkPos);
          updatedNodes[leader].E = Math.max(0, updatedNodes[leader].E - (dSink > 75 ? 0.0028 : 0.0014));
          roundPackets += 2;
        }
      }

      setChConnections(newChConns);
      setChainConnections(newChainConns);
      setThroughput((prev) => prev + roundPackets);

      const newAliveCount = updatedNodes.filter((n) => n.E > 0).length;
      setAliveCount(newAliveCount);

      const totalE = updatedNodes.filter((n) => n.E > 0).reduce((acc, n) => acc + n.E, 0);
      setAvgEnergy(newAliveCount > 0 ? totalE / newAliveCount : 0);

      return updatedNodes;
    });

    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (isRunning) {
      const timer = setInterval(() => {
        stepSimulation();
      }, speed);
      return () => clearInterval(timer);
    }
  }, [isRunning, speed, protocol, sinkPos, numNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / 100;
    const scaleY = height / 100;

    ctx.fillStyle = '#050907';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#0e1f16';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += height / 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;
    chConnections.forEach((conn) => {
      ctx.beginPath();
      ctx.moveTo(conn.from.x * scaleX, conn.from.y * scaleY);
      ctx.lineTo(conn.to.x * scaleX, conn.to.y * scaleY);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    chainConnections.forEach((conn) => {
      ctx.beginPath();
      ctx.moveTo(conn.from.x * scaleX, conn.from.y * scaleY);
      ctx.lineTo(conn.to.x * scaleX, conn.to.y * scaleY);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const sinkX = sinkPos.x * scaleX;
    const sinkY = sinkPos.y * scaleY;
    
    const pulseRadius = 14 + Math.sin(Date.now() / 250) * 4;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.arc(sinkX, sinkY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(sinkX, sinkY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BASE STATION', sinkX, sinkY - 14);

    nodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = node.y * scaleY;
      const energyRatio = node.E / node.maxE;

      if (node.E <= 0) {
        ctx.fillStyle = '#1e2923';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        let color = '#10b981';
        if (energyRatio < 0.3) color = '#ef4444';
        else if (energyRatio < 0.7) color = '#f59e0b';

        if (node.type === 'super') {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nx, ny, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else if (node.type === 'advanced') {
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (node.isCH) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.beginPath();
          ctx.arc(nx, ny, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(sinkX, sinkY);
          ctx.stroke();
        }

        ctx.fillStyle = node.isCH ? '#f59e0b' : color;
        ctx.beginPath();
        ctx.arc(nx, ny, node.isCH ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [nodes, chConnections, chainConnections, sinkPos]);

  return (
    <section id="simulator-canvas" className="py-16 px-4 relative border-t border-[#1C3150]/60 bg-[#050912]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
            <Zap className="w-3.5 h-3.5" />
            Interactive Protocol Execution Laboratory
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono tracking-tight">
            Real-Time WSN Routing &amp; Energy Dissipation Simulator
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Live simulation of LEACH, PEGASIS, Hybrid, and PSO-Hybrid routing protocols. Observe cluster-head formation, intra-cluster chaining, and battery depletion in real time.
          </p>
        </div>

        <div className="bg-[#0D1626] rounded-3xl p-6 sm:p-8 border border-[#1C3150] shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-[#1C3150]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-base font-bold text-white font-mono">
                  ACTIVE ROUTING ENGINE • {protocol.toUpperCase()}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Click anywhere inside canvas to dynamically reposition the Base Station (Sink).
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 font-mono text-xs">
              <div className="bg-[#070B14] px-3.5 py-1.5 rounded-xl border border-[#1C3150] text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Round</span>
                <span className="text-sm font-bold text-cyan-400">{round}</span>
              </div>
              <div className="bg-[#070B14] px-3.5 py-1.5 rounded-xl border border-[#1C3150] text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Alive</span>
                <span className="text-sm font-bold text-emerald-400">{aliveCount} / {numNodes}</span>
              </div>
              <div className="bg-[#070B14] px-3.5 py-1.5 rounded-xl border border-[#1C3150] text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Avg Energy</span>
                <span className="text-sm font-bold text-amber-400">{avgEnergy.toFixed(3)} J</span>
              </div>
              <div className="bg-[#070B14] px-3.5 py-1.5 rounded-xl border border-[#1C3150] text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Packets</span>
                <span className="text-sm font-bold text-violet-400">{throughput.toLocaleString()}</span>
              </div>
              <div className="bg-[#070B14] px-3.5 py-1.5 rounded-xl border border-[#1C3150] text-center">
                <span className="text-[10px] text-slate-400 block uppercase">FND Round</span>
                <span className="text-sm font-bold text-pink-400">{fnd !== null ? fnd : '—'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative bg-[#070B14] rounded-2xl border border-[#1C3150] overflow-hidden flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                width={620}
                height={500}
                className="w-full h-auto max-h-[500px] object-contain rounded-xl cursor-crosshair"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setSinkPos({ x: Math.round(x), y: Math.round(y) });
                }}
              />
              <div className="absolute top-4 left-4 bg-[#0D1626]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1C3150] text-xs font-mono text-cyan-300">
                Sink Position: ({sinkPos.x}, {sinkPos.y})
              </div>
            </div>

            <div className="bg-[#070B14] p-5 rounded-2xl border border-[#1C3150] flex flex-col justify-between space-y-5 font-mono">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Routing Protocol Config
                </h4>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5 uppercase">
                    Protocol Selection
                  </label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as RoutingProtocol)}
                    className="w-full bg-[#0B1220] border border-[#1C3150] rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="pso_hybrid">✨ PSO-Hybrid (Metaheuristic Swarm)</option>
                    <option value="hybrid">⚡ Standard Hybrid (LEACH + PEGASIS)</option>
                    <option value="pegasis">🔗 PEGASIS (Greedy Chain-Based)</option>
                    <option value="leach">📡 LEACH (Cluster-Based)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Node Count (N):</span>
                    <strong className="text-white">{numNodes}</strong>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={150}
                    step={10}
                    value={numNodes}
                    onChange={(e) => setNumNodes(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-[#0B1220] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Initial Energy (E0):</span>
                    <strong className="text-white">{initialEnergy.toFixed(1)} J</strong>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={initialEnergy}
                    onChange={(e) => setInitialEnergy(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-[#0B1220] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#0B1220] rounded-xl border border-[#1C3150] text-xs">
                  <span className="text-slate-300">Heterogeneous Nodes:</span>
                  <button
                    onClick={() => setIsHeterogeneous(!isHeterogeneous)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      isHeterogeneous
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'bg-[#070B14] text-slate-400 border border-[#1C3150]'
                    }`}
                  >
                    {isHeterogeneous ? 'ENABLED (3-Tier)' : 'DISABLED'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Execution Delay:</span>
                    <strong className="text-cyan-400">{speed} ms</strong>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={150}
                    step={10}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-[#0B1220] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C3150]">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'PAUSE SIMULATION' : 'RUN SIMULATION'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={stepSimulation}
                    disabled={isRunning}
                    className="py-2 bg-[#0B1220] hover:bg-[#111c33] text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-[#1C3150] disabled:opacity-50"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>STEP 1 RND</span>
                  </button>
                  <button
                    onClick={resetNetwork}
                    className="py-2 bg-[#0B1220] hover:bg-[#111c33] text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-[#1C3150]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const InteractiveSimulator = RoutingProtocolsLab;
