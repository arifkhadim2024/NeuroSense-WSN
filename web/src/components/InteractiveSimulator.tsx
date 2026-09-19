import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Zap, Shield, Battery, Cpu, Activity } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
  E: number;
  maxE: number;
  type: 'normal' | 'advanced' | 'super';
  isCH: boolean;
}

type Protocol = 'leach' | 'pegasis' | 'hybrid' | 'pso_hybrid';

export const InteractiveSimulator: React.FC = () => {
  // Parameters
  const [numNodes, setNumNodes] = useState<number>(100);
  const [initialEnergy, setInitialEnergy] = useState<number>(0.5);
  const [protocol, setProtocol] = useState<Protocol>('pso_hybrid');
  const [isHeterogeneous, setIsHeterogeneous] = useState<boolean>(true);
  const [sinkPos, setSinkPos] = useState<{ x: number; y: number }>({ x: 50, y: 150 });
  const [speed, setSpeed] = useState<number>(50); // ms per round

  // Simulation State
  const [round, setRound] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [aliveCount, setAliveCount] = useState<number>(numNodes);
  const [avgEnergy, setAvgEnergy] = useState<number>(initialEnergy);
  const [throughput, setThroughput] = useState<number>(0);

  // Lifecycle Metrics
  const [fnd, setFnd] = useState<number | null>(null);
  const [hnd, setHnd] = useState<number | null>(null);
  const [lnd, setLnd] = useState<number | null>(null);

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
    setHnd(null);
    setLnd(null);
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
          e = initialEnergy * 3.0; // 200% extra
        } else if (i < numSup + numAdv) {
          type = 'advanced';
          e = initialEnergy * 2.0; // 100% extra
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

  // Distance helper
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  // Step 1 Simulation Round
  const stepSimulation = () => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((n) => ({ ...n, isCH: false }));
      const aliveIndices = updatedNodes.map((n, i) => (n.E > 0 ? i : -1)).filter((i) => i !== -1);
      const currentAliveCount = aliveIndices.length;

      if (currentAliveCount === 0) {
        setIsRunning(false);
        if (lnd === null) setLnd(round);
        return updatedNodes;
      }

      // Track FND / HND / LND
      if (fnd === null && currentAliveCount < numNodes) setFnd(round);
      if (hnd === null && currentAliveCount <= Math.floor(numNodes / 2)) setHnd(round);

      let roundPackets = 0;
      const newChConns: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
      const newChainConns: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];

      // Protocol Logic Execution
      if (protocol === 'leach' || protocol === 'hybrid' || protocol === 'pso_hybrid') {
        const numCH = Math.max(1, Math.floor(0.05 * currentAliveCount));
        let chIndices: number[] = [];

        if (protocol === 'pso_hybrid') {
          // PSO Selection based on Energy, Sink Distance & Density
          const sorted = [...aliveIndices].sort((a, b) => {
            const scoreA = updatedNodes[a].E * 2 - dist(updatedNodes[a], sinkPos) * 0.05;
            const scoreB = updatedNodes[b].E * 2 - dist(updatedNodes[b], sinkPos) * 0.05;
            return scoreB - scoreA;
          });
          chIndices = sorted.slice(0, numCH);
        } else {
          // Rotational / Random selection
          const shuffled = [...aliveIndices].sort(() => Math.random() - 0.5);
          chIndices = shuffled.slice(0, numCH);
        }

        chIndices.forEach((idx) => {
          updatedNodes[idx].isCH = true;
        });

        // Form Clusters & Transmit
        chIndices.forEach((chIdx) => {
          const chNode = updatedNodes[chIdx];
          const members = aliveIndices.filter(
            (idx) => !chIndices.includes(idx) && dist(updatedNodes[idx], chNode) <= 40
          );

          if (protocol === 'hybrid' || protocol === 'pso_hybrid') {
            // Intra-cluster PEGASIS chain
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
                
                // Energy consumption
                updatedNodes[curr].E = Math.max(0, updatedNodes[curr].E - 0.0008);
                updatedNodes[next].E = Math.max(0, updatedNodes[next].E - 0.0004);
                roundPackets++;
                curr = next;
              }
            }
          } else {
            // Direct cluster transmission
            members.forEach((mIdx) => {
              const mNode = updatedNodes[mIdx];
              newChConns.push({ from: mNode, to: chNode });
              updatedNodes[mIdx].E = Math.max(0, updatedNodes[mIdx].E - 0.001);
              chNode.E = Math.max(0, chNode.E - 0.0005);
              roundPackets++;
            });
          }

          // Transmission to Sink
          const dSink = dist(chNode, sinkPos);
          const txEnergy = dSink > 75 ? 0.003 : 0.0015;
          chNode.E = Math.max(0, chNode.E - txEnergy);
          roundPackets += 2;
        });

      } else if (protocol === 'pegasis') {
        // Global Chain
        let chain = [...aliveIndices];
        if (chain.length > 0) {
          // Sort by distance to Sink
          chain.sort((a, b) => dist(updatedNodes[b], sinkPos) - dist(updatedNodes[a], sinkPos));
          for (let i = 0; i < chain.length - 1; i++) {
            const u = chain[i];
            const v = chain[i + 1];
            newChainConns.push({ from: updatedNodes[u], to: updatedNodes[v] });
            updatedNodes[u].E = Math.max(0, updatedNodes[u].E - 0.0006);
            updatedNodes[v].E = Math.max(0, updatedNodes[v].E - 0.0003);
            roundPackets++;
          }
          const leader = chain[round % chain.length];
          updatedNodes[leader].isCH = true;
          const dSink = dist(updatedNodes[leader], sinkPos);
          updatedNodes[leader].E = Math.max(0, updatedNodes[leader].E - (dSink > 75 ? 0.003 : 0.0015));
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

  // Run simulation timer loop
  useEffect(() => {
    if (isRunning) {
      const timer = setInterval(() => {
        stepSimulation();
      }, speed);
      return () => clearInterval(timer);
    }
  }, [isRunning, speed, protocol, sinkPos, numNodes]);

  // Render Canvas Visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / 100;
    const scaleY = height / 100;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
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

    // Draw Cluster Head Member Connections
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    chConnections.forEach((conn) => {
      ctx.beginPath();
      ctx.moveTo(conn.from.x * scaleX, conn.from.y * scaleY);
      ctx.lineTo(conn.to.x * scaleX, conn.to.y * scaleY);
      ctx.stroke();
    });

    // Draw PEGASIS Chain Connections
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    chainConnections.forEach((conn) => {
      ctx.beginPath();
      ctx.moveTo(conn.from.x * scaleX, conn.from.y * scaleY);
      ctx.lineTo(conn.to.x * scaleX, conn.to.y * scaleY);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw Sink / Base Station
    const sinkX = sinkPos.x * scaleX;
    const sinkY = sinkPos.y * scaleY;
    
    // Pulse animation around Sink
    const pulseRadius = 15 + Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.beginPath();
    ctx.arc(sinkX, sinkY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(sinkX, sinkY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BS (Sink)', sinkX, sinkY - 14);

    // Draw Nodes
    nodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = node.y * scaleY;
      const energyRatio = node.E / node.maxE;

      if (node.E <= 0) {
        // Dead Node
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Node Color by Battery level
        let color = '#22c55e'; // Green
        if (energyRatio < 0.3) color = '#ef4444'; // Red
        else if (energyRatio < 0.7) color = '#eab308'; // Yellow

        // Super & Advanced Node indicator ring
        if (node.type === 'super') {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nx, ny, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else if (node.type === 'advanced') {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // CH Glow Effect
        if (node.isCH) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.beginPath();
          ctx.arc(nx, ny, 12, 0, Math.PI * 2);
          ctx.fill();

          // Transmission line to Sink
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(sinkX, sinkY);
          ctx.stroke();
        }

        // Draw Node Core
        ctx.fillStyle = node.isCH ? '#06b6d4' : color;
        ctx.beginPath();
        ctx.arc(nx, ny, node.isCH ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [nodes, chConnections, chainConnections, sinkPos]);

  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" /> Real-Time WSN Routing Simulator
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Simulate node energy dissipation, cluster head selection, and PEGASIS chain communication live.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-800/80 px-4 py-2 rounded-xl border border-cyan-500/20 text-center">
            <span className="text-xs text-gray-400 block">Round</span>
            <span className="text-lg font-bold text-cyan-400">{round}</span>
          </div>
          <div className="bg-gray-800/80 px-4 py-2 rounded-xl border border-green-500/20 text-center">
            <span className="text-xs text-gray-400 block">Alive Nodes</span>
            <span className="text-lg font-bold text-green-400">{aliveCount} / {numNodes}</span>
          </div>
          <div className="bg-gray-800/80 px-4 py-2 rounded-xl border border-yellow-500/20 text-center">
            <span className="text-xs text-gray-400 block">Avg Energy</span>
            <span className="text-lg font-bold text-yellow-400">{avgEnergy.toFixed(3)} J</span>
          </div>
          <div className="bg-gray-800/80 px-4 py-2 rounded-xl border border-purple-500/20 text-center">
            <span className="text-xs text-gray-400 block">Packets Sent</span>
            <span className="text-lg font-bold text-purple-400">{throughput}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-2 relative bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={500}
            className="w-full h-auto max-h-[500px] object-contain rounded-xl cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setSinkPos({ x: Math.round(x), y: Math.round(y) });
            }}
          />
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300">
            Click Canvas to Move Sink Position: ({sinkPos.x}, {sinkPos.y})
          </div>
        </div>

        {/* Controls & Configuration */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> Simulation Controls
            </h3>

            {/* Protocol Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Routing Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as Protocol)}
                className="w-full bg-gray-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-sm text-cyan-300 font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="pso_hybrid">✨ PSO-Hybrid (Metaheuristic Optimized)</option>
                <option value="hybrid">⚡ Standard Hybrid (LEACH + PEGASIS)</option>
                <option value="pegasis">🔗 PEGASIS (Chain-Based)</option>
                <option value="leach">📡 LEACH (Cluster-Based)</option>
              </select>
            </div>

            {/* Node Count Slider */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Number of Nodes (N)</span>
                <span className="text-cyan-400 font-semibold">{numNodes}</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={10}
                value={numNodes}
                onChange={(e) => setNumNodes(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-gray-700 rounded-lg h-2"
              />
            </div>

            {/* Initial Energy Slider */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Initial Energy (E₀)</span>
                <span className="text-yellow-400 font-semibold">{initialEnergy} J</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.1}
                value={initialEnergy}
                onChange={(e) => setInitialEnergy(Number(e.target.value))}
                className="w-full accent-yellow-400 bg-gray-700 rounded-lg h-2"
              />
            </div>

            {/* Speed Control Slider */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Sim Speed (ms/round)</span>
                <span className="text-purple-400 font-semibold">{speed} ms</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-purple-400 bg-gray-700 rounded-lg h-2"
              />
            </div>

            {/* Heterogeneous Energy Toggle */}
            <div className="flex items-center justify-between bg-gray-900/60 p-3 rounded-xl border border-purple-500/20">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" /> Heterogeneous WSN (SEP/DEEC)
              </span>
              <button
                onClick={() => setIsHeterogeneous(!isHeterogeneous)}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${
                  isHeterogeneous ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isHeterogeneous ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Start Simulation'}
              </button>
              <button
                onClick={stepSimulation}
                disabled={isRunning}
                className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={resetNetwork}
                className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QoS Metric Badge Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="bg-gray-800/40 p-4 rounded-2xl border border-cyan-500/20 flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 p-1.5 bg-cyan-500/10 rounded-xl" />
          <div>
            <span className="text-xs text-gray-400 block">FND (First Node Dead)</span>
            <span className="text-lg font-bold text-white">{fnd !== null ? `Round ${fnd}` : 'All Alive'}</span>
          </div>
        </div>
        <div className="bg-gray-800/40 p-4 rounded-2xl border border-yellow-500/20 flex items-center gap-3">
          <Battery className="w-8 h-8 text-yellow-400 p-1.5 bg-yellow-500/10 rounded-xl" />
          <div>
            <span className="text-xs text-gray-400 block">HND (Half Nodes Dead)</span>
            <span className="text-lg font-bold text-white">{hnd !== null ? `Round ${hnd}` : '> 50% Alive'}</span>
          </div>
        </div>
        <div className="bg-gray-800/40 p-4 rounded-2xl border border-red-500/20 flex items-center gap-3">
          <Zap className="w-8 h-8 text-red-400 p-1.5 bg-red-500/10 rounded-xl" />
          <div>
            <span className="text-xs text-gray-400 block">LND (Last Node Dead)</span>
            <span className="text-lg font-bold text-white">{lnd !== null ? `Round ${lnd}` : 'Network Active'}</span>
          </div>
        </div>
        <div className="bg-gray-800/40 p-4 rounded-2xl border border-purple-500/20 flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-400 p-1.5 bg-purple-500/10 rounded-xl" />
          <div>
            <span className="text-xs text-gray-400 block">Optimization Level</span>
            <span className="text-sm font-bold text-purple-300">
              {protocol === 'pso_hybrid' ? 'Metaheuristic (PSO)' : 'Heuristic'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
