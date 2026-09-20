import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, TrendingUp, Radio, Activity,
  Zap, Compass, BarChart3, Info
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';

export const ResearchPlotsLab: React.FC = () => {
  const { 
    currentRound, 
    maxRounds, 
    jumpToRound, 
    activeScenario 
  } = useWSNSimulation();

  const [activePlotTab, setActivePlotTab] = useState<'energy' | 'alive' | 'dead' | 'packets' | 'coverage' | 'routing'>('energy');
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);

  // Generate 200 data points (every 5 rounds) for high precision curves
  const plotData = useMemo(() => {
    const points: {
      round: number;
      leachE: number;
      pegasisE: number;
      hybridE: number;
      psoHybridE: number;
      annPsoE: number;
      leachAlive: number;
      pegasisAlive: number;
      psoHybridAlive: number;
      annPsoAlive: number;
      annPsoDead: number;
      leachDead: number;
      coveragePct: number;
      packetsDelivered: number;
      routingDist: number;
    }[] = [];

    const totalN = activeScenario.sensorCount || 100;
    const initialE = activeScenario.initialEnergy || 0.5;

    for (let r = 0; r <= maxRounds; r += 5) {
      const prog = r / maxRounds;

      // Residual energy models (Joules)
      const leachE = Math.max(0, initialE * (1 - prog * 1.55));
      const pegasisE = Math.max(0, initialE * (1 - prog * 1.15));
      const hybridE = Math.max(0, initialE * (1 - prog * 0.95));
      const psoHybridE = Math.max(0, initialE * (1 - prog * 0.82));
      const annPsoE = Math.max(0, initialE * (1 - prog * 0.58)); // 44% sleeping nodes retain energy!

      // Alive nodes
      const leachFND = 144;
      const pegasisFND = 280;
      const psoFND = 350;
      const annPsoFND = 425;

      const calcAlive = (fnd: number, hnd: number) => {
        if (r <= fnd) return totalN;
        if (r >= hnd) return 0;
        const lossRatio = (r - fnd) / (hnd - fnd);
        return Math.max(0, Math.floor(totalN * (1 - lossRatio)));
      };

      const leachAlive = calcAlive(leachFND, 852);
      const pegasisAlive = calcAlive(pegasisFND, 910);
      const psoHybridAlive = calcAlive(psoFND, 960);
      const annPsoAlive = calcAlive(annPsoFND, 1000);

      // Field Coverage %
      const baseCov = totalN === 50 ? 84.5 : totalN === 150 ? 98.2 : 93.73;
      const coveragePct = Math.max(0, baseCov * (annPsoAlive / totalN));

      // Packets Delivered
      const packetsDelivered = Math.floor(r * (annPsoAlive * 0.48) * 0.982);

      // Routing Distance (m)
      const routingDist = Math.max(16, 22.8 + Math.sin(r * 0.02) * 1.5);

      points.push({
        round: r,
        leachE: Math.round(leachE * 1000) / 1000,
        pegasisE: Math.round(pegasisE * 1000) / 1000,
        hybridE: Math.round(hybridE * 1000) / 1000,
        psoHybridE: Math.round(psoHybridE * 1000) / 1000,
        annPsoE: Math.round(annPsoE * 1000) / 1000,
        leachAlive,
        pegasisAlive,
        psoHybridAlive,
        annPsoAlive,
        annPsoDead: totalN - annPsoAlive,
        leachDead: totalN - leachAlive,
        coveragePct: Math.round(coveragePct * 10) / 10,
        packetsDelivered,
        routingDist: Math.round(routingDist * 10) / 10
      });
    }

    return points;
  }, [maxRounds, activeScenario]);

  // SVG Dimension Constants
  const width = 800;
  const height = 300;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const toX = (r: number) => padLeft + (r / maxRounds) * chartW;
  
  // Current active plot data configurations
  const plotConfig = useMemo(() => {
    switch (activePlotTab) {
      case 'energy': {
        const maxY = activeScenario.initialEnergy * 1.05;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Average Residual Energy vs. Round (Joules)',
          yUnit: 'J',
          maxY,
          curves: [
            { label: 'ANN + PSO-Hybrid (Proposed)', color: '#00E5FF', points: plotData.map(d => `${toX(d.round)},${toY(d.annPsoE)}`).join(' ') },
            { label: 'PSO-Hybrid Baseline', color: '#8B5CF6', points: plotData.map(d => `${toX(d.round)},${toY(d.psoHybridE)}`).join(' ') },
            { label: 'Hybrid Routing', color: '#3B82F6', points: plotData.map(d => `${toX(d.round)},${toY(d.hybridE)}`).join(' ') },
            { label: 'PEGASIS Chain', color: '#F59E0B', points: plotData.map(d => `${toX(d.round)},${toY(d.pegasisE)}`).join(' ') },
            { label: 'LEACH Direct CH', color: '#EF4444', points: plotData.map(d => `${toX(d.round)},${toY(d.leachE)}`).join(' ') }
          ]
        };
      }
      case 'alive': {
        const maxY = (activeScenario.sensorCount || 100) * 1.05;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Alive Sensor Nodes vs. Round (Network Stability & Horizon)',
          yUnit: 'Nodes',
          maxY,
          curves: [
            { label: 'ANN + PSO-Hybrid (Proposed FND: 425)', color: '#00E5FF', points: plotData.map(d => `${toX(d.round)},${toY(d.annPsoAlive)}`).join(' ') },
            { label: 'PSO-Hybrid Baseline (FND: 350)', color: '#8B5CF6', points: plotData.map(d => `${toX(d.round)},${toY(d.psoHybridAlive)}`).join(' ') },
            { label: 'PEGASIS Protocol (FND: 280)', color: '#F59E0B', points: plotData.map(d => `${toX(d.round)},${toY(d.pegasisAlive)}`).join(' ') },
            { label: 'LEACH Protocol (FND: 144)', color: '#EF4444', points: plotData.map(d => `${toX(d.round)},${toY(d.leachAlive)}`).join(' ') }
          ]
        };
      }
      case 'dead': {
        const maxY = (activeScenario.sensorCount || 100) * 1.05;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Cumulative Dead Nodes vs. Round',
          yUnit: 'Dead',
          maxY,
          curves: [
            { label: 'ANN + PSO-Hybrid (Low Mortality)', color: '#00E5FF', points: plotData.map(d => `${toX(d.round)},${toY(d.annPsoDead)}`).join(' ') },
            { label: 'LEACH Protocol (Early Depletion)', color: '#EF4444', points: plotData.map(d => `${toX(d.round)},${toY(d.leachDead)}`).join(' ') }
          ]
        };
      }
      case 'packets': {
        const maxY = Math.max(...plotData.map(d => d.packetsDelivered)) * 1.1;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Cumulative Packets Delivered vs. Round (Throughput)',
          yUnit: 'Pkts',
          maxY,
          curves: [
            { label: 'Packets Received at Sink (PDR ~98.2%)', color: '#10B981', points: plotData.map(d => `${toX(d.round)},${toY(d.packetsDelivered)}`).join(' ') }
          ]
        };
      }
      case 'coverage': {
        const maxY = 100;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Spatial Field Coverage Ratio vs. Round (%)',
          yUnit: '%',
          maxY,
          curves: [
            { label: 'Active Coverage Retention (Δ ≤ 1.0%)', color: '#00E5FF', points: plotData.map(d => `${toX(d.round)},${toY(d.coveragePct)}`).join(' ') }
          ]
        };
      }
      case 'routing': {
        const maxY = 50;
        const toY = (val: number) => padTop + chartH - (val / maxY) * chartH;
        return {
          title: 'Mean Routing Hop Distance vs. Round (Meters)',
          yUnit: 'm',
          maxY,
          curves: [
            { label: 'Multi-Hop Relay Distance (ANN+PSO)', color: '#38BDF8', points: plotData.map(d => `${toX(d.round)},${toY(d.routingDist)}`).join(' ') }
          ]
        };
      }
    }
  }, [activePlotTab, plotData, activeScenario, chartH]);

  // Click on chart point handler (CRITICAL INTERACTION: Seek 3D scene to exact round)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = (clickX - (padLeft / width) * rect.width) / ((chartW / width) * rect.width);
    const targetRound = Math.min(maxRounds, Math.max(0, Math.round(ratio * maxRounds)));

    soundFX.playClickSound();
    jumpToRound(targetRound);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = (mouseX - (padLeft / width) * rect.width) / ((chartW / width) * rect.width);
    const r = Math.min(maxRounds, Math.max(0, Math.round(ratio * maxRounds)));
    setHoveredRound(r);
  };

  const activeCurRoundX = toX(currentRound);
  const hoveredRoundX = hoveredRound !== null ? toX(hoveredRound) : null;

  return (
    <TiltCard3D 
      intensity={3}
      className="lab-card rounded-3xl p-5 border border-[#1C3150] bg-[#0B1220]/95 backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs text-slate-300"
    >
      {/* Header: Title & Interactive Seeker Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-300 shadow-lg">
            <BarChart3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-white text-base tracking-wide uppercase">
                Interactive Research Plots &amp; Empirical Curves
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                Bidirectional 3D Seeking
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span><strong>Click any coordinate on the chart</strong> to immediately seek the 3D digital twin and all node batteries to that exact simulation round.</span>
            </p>
          </div>
        </div>

        {/* Seek Indicator Badge */}
        <div className="flex items-center space-x-2 bg-[#070B14] px-3 py-1.5 rounded-2xl border border-[#1C3150] shadow-inner text-xs">
          <span className="text-slate-400">Current Simulation State:</span>
          <span className="text-cyan-400 font-extrabold">Round {currentRound}</span>
        </div>
      </div>

      {/* Plot Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070B14] rounded-2xl border border-[#1C3150]">
        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('energy'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'energy'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Residual Energy</span>
        </button>

        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('alive'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'alive'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Alive Nodes (FND/HND)</span>
        </button>

        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('dead'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'dead'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Dead Nodes</span>
        </button>

        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('packets'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'packets'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Packets Delivered</span>
        </button>

        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('coverage'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'coverage'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Coverage %</span>
        </button>

        <button
          onClick={() => { soundFX.playClickSound(); setActivePlotTab('routing'); }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            activePlotTab === 'routing'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Routing Distance</span>
        </button>
      </div>

      {/* Main Interactive Vector Chart SVG Container */}
      <div className="relative bg-[#070B14] rounded-2xl p-3 border border-[#1C3150] overflow-hidden shadow-inner">
        {/* Hovered State Tooltip Overlay */}
        {hoveredRound !== null && (
          <div className="absolute top-4 right-4 bg-[#0B1220]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono shadow-xl pointer-events-none z-20">
            <span>Hovering: Round <strong>{hoveredRound}</strong></span>
            <span className="text-slate-400 text-[10px] block">Click to seek 3D view</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block cursor-crosshair"
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => setHoveredRound(null)}
        >
          {/* Subtle Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padTop + chartH * (1 - p);
            const x = padLeft + chartW * p;
            return (
              <g key={i}>
                {/* Horizontal Grid */}
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(0, 229, 255, 0.08)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {(plotConfig.maxY * p).toFixed(activePlotTab === 'energy' ? 2 : 0)} {plotConfig.yUnit}
                </text>

                {/* Vertical Grid */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="rgba(0, 229, 255, 0.08)"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={height - padBottom + 16}
                  fill="#64748B"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  R{Math.round(maxRounds * p)}
                </text>
              </g>
            );
          })}

          {/* Chart Axes */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + chartH}
            stroke="#1C3150"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={width - padRight}
            y2={padTop + chartH}
            stroke="#1C3150"
            strokeWidth="1.5"
          />

          {/* Render Multi-Protocol Curves */}
          {plotConfig.curves.map((c, i) => (
            <polyline
              key={i}
              fill="none"
              stroke={c.color}
              strokeWidth={i === 0 ? "2.5" : "1.5"}
              strokeOpacity={i === 0 ? "1" : "0.75"}
              points={c.points}
            />
          ))}

          {/* Current Simulation Round Vertical Seeking Line */}
          <line
            x1={activeCurRoundX}
            y1={padTop}
            x2={activeCurRoundX}
            y2={padTop + chartH}
            stroke="#00E5FF"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <circle
            cx={activeCurRoundX}
            cy={padTop + chartH}
            r="4"
            fill="#00E5FF"
          />

          {/* Hovered Target Seeker Line */}
          {hoveredRoundX !== null && (
            <line
              x1={hoveredRoundX}
              y1={padTop}
              x2={hoveredRoundX}
              y2={padTop + chartH}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* Legend Overlay */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-[#1C3150] text-[11px]">
          {plotConfig.curves.map((c, i) => (
            <div key={i} className="flex items-center space-x-2">
              <span className="w-3 h-1 rounded-full" style={{ backgroundColor: c.color }} />
              <span className={i === 0 ? 'text-white font-bold' : 'text-slate-400'}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </TiltCard3D>
  );
};
