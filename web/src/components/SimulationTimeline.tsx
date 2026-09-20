import React from 'react';
import { 
  Play, Pause, RotateCcw, 
  Activity, Zap, ShieldAlert, Cpu, ChevronRight, ChevronLeft,
  Layers, ShieldCheck, Flame, Brain, GitBranch, Radio, Sparkles
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';

export interface Timeline10StageInfo {
  stage: number;
  label: string;
  name: string;
  shortDesc: string;
  icon: React.ElementType;
}

export const TIMELINE_10_STAGES: Timeline10StageInfo[] = [
  { stage: 1, label: '01', name: 'DEPLOYMENT', shortDesc: 'Stochastic Sensor Field Distribution', icon: Layers },
  { stage: 2, label: '02', name: 'COVERAGE', shortDesc: 'Vectorized Sensing Grid Evaluation', icon: ShieldCheck },
  { stage: 3, label: '03', name: 'OVERLAP', shortDesc: 'Redundant Multi-Sensor Disk Detection', icon: Flame },
  { stage: 4, label: '04', name: 'ANN ANALYSIS', shortDesc: '10-D Spatial Feature MLP Prediction', icon: Brain },
  { stage: 5, label: '05', name: 'ACTIVE/SLEEP', shortDesc: 'Adaptive Sleep-Scheduling Selection', icon: Sparkles },
  { stage: 6, label: '06', name: 'CLUSTERING', shortDesc: 'Swarm Multi-Objective CH Election', icon: Cpu },
  { stage: 7, label: '07', name: 'PSO ROUTING', shortDesc: 'Multi-Hop PEGASIS Inter-Cluster Chains', icon: GitBranch },
  { stage: 8, label: '08', name: 'PACKET TRANSMISSION', shortDesc: 'Multi-Particle Telemetry Laser Stream', icon: Zap },
  { stage: 9, label: '09', name: 'ENERGY UPDATE', shortDesc: 'First-Order Radio Model Dissipation', icon: Activity },
  { stage: 10, label: '10', name: 'FINAL RESULTS', shortDesc: 'Telemetry Ingestion at Base Station', icon: Radio },
];

export const SimulationTimeline: React.FC = () => {
  const {
    currentRound,
    maxRounds,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    restart,
    stepForward,
    stepBackward,
    jumpToRound,
    setPlaybackSpeed,
    telemetry,
    selectedProtocol,
    timeline10Stage,
    setTimeline10Stage,
    setCameraMode,
    setAnnHeatmapMode,
    setShowANNMoveVectors,
    setShowOverlapConcentration,
    setShowBlindspotHoles,
    executeOptimization,
    runANNInference
  } = useWSNSimulation();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetRound = parseInt(e.target.value, 10);
    jumpToRound(targetRound);
  };

  const selectStage = (stageNum: number) => {
    soundFX.playClickSound();
    setTimeline10Stage(stageNum);

    switch (stageNum) {
      case 1: // 01 DEPLOYMENT
        restart();
        setCameraMode('perspective');
        setAnnHeatmapMode(false);
        setShowANNMoveVectors(false);
        setShowOverlapConcentration(false);
        setShowBlindspotHoles(false);
        break;
      case 2: // 02 COVERAGE
        setCameraMode('top');
        setShowOverlapConcentration(false);
        setShowBlindspotHoles(false);
        setShowANNMoveVectors(false);
        break;
      case 3: // 03 OVERLAP
        setCameraMode('top');
        setShowOverlapConcentration(true);
        setShowBlindspotHoles(false);
        setShowANNMoveVectors(false);
        break;
      case 4: // 04 ANN ANALYSIS
        setCameraMode('perspective');
        runANNInference();
        setAnnHeatmapMode(true);
        setShowANNMoveVectors(true);
        setShowOverlapConcentration(false);
        setShowBlindspotHoles(false);
        break;
      case 5: // 05 ACTIVE/SLEEP SELECTION
        setCameraMode('perspective');
        setAnnHeatmapMode(true);
        setShowANNMoveVectors(true);
        setShowOverlapConcentration(false);
        setShowBlindspotHoles(false);
        break;
      case 6: // 06 CLUSTERING
        setCameraMode('isometric');
        setShowANNMoveVectors(false);
        setShowOverlapConcentration(false);
        setShowBlindspotHoles(false);
        break;
      case 7: // 07 PSO-HYBRID ROUTING
        setCameraMode('perspective');
        executeOptimization();
        break;
      case 8: // 08 PACKET TRANSMISSION
        setCameraMode('perspective');
        play();
        break;
      case 9: // 09 ENERGY UPDATE
        setCameraMode('perspective');
        stepForward(5);
        break;
      case 10: // 10 FINAL RESULTS
        setCameraMode('sink');
        break;
      default:
        break;
    }
  };

  const fnd = telemetry.firstNodeDeadRound || 425;
  const hnd = telemetry.halfNodeDeadRound || 1000;
  const progressPct = (currentRound / maxRounds) * 100;
  const currentStageInfo = TIMELINE_10_STAGES[timeline10Stage - 1] || TIMELINE_10_STAGES[0];
  const StageIcon = currentStageInfo.icon;

  return (
    <TiltCard3D 
      intensity={3}
      className="lab-card rounded-3xl p-4 sm:p-5 border border-[#1C3150] bg-[#070B14]/95 backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs text-slate-300"
    >
      {/* Top Header: Timeline Stage & Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-md">
            <StageIcon className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                STAGE {currentStageInfo.label}: {currentStageInfo.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
                {selectedProtocol.replace('_', '-').toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              {currentStageInfo.shortDesc}
            </div>
          </div>
        </div>

        {/* Current Round Display Badge */}
        <div className="flex items-center space-x-3 bg-[#0B1220] px-3.5 py-1.5 rounded-2xl border border-[#1C3150] shadow-inner">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
              OPERATIONAL ROUND
            </span>
            <span className="text-base font-black text-cyan-400">
              {currentRound} <span className="text-slate-500 text-xs font-normal">/ {maxRounds}</span>
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        </div>
      </div>

      {/* 10-Stage Visual Workflow Pipeline Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
          <span>10-Stage Scientific Simulation Workflow</span>
          <span className="text-cyan-400">Stage {timeline10Stage} of 10</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
          {TIMELINE_10_STAGES.map((st) => {
            const isCurrent = timeline10Stage === st.stage;
            const isCompleted = timeline10Stage > st.stage;
            const Icon = st.icon;

            return (
              <button
                key={st.stage}
                onClick={() => selectStage(st.stage)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-gradient-to-br from-cyan-500/30 via-blue-600/30 to-violet-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 font-bold'
                    : isCompleted
                    ? 'bg-[#0B1220] border-cyan-500/30 text-cyan-300/80 hover:border-cyan-400'
                    : 'bg-[#070B14] border-[#1C3150] text-slate-500 hover:text-slate-300 hover:border-[#2A466E]'
                }`}
                title={`Stage ${st.label}: ${st.name} — ${st.shortDesc}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-black ${
                    isCurrent ? 'bg-cyan-400 text-slate-950' : 'text-slate-400'
                  }`}>
                    {st.label}
                  </span>
                  <Icon className={`w-3 h-3 ${isCurrent ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                </div>
                <div className="text-[10px] truncate font-bold leading-tight">
                  {st.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scrubbable Slider with Milestone Flags */}
      <div className="space-y-2 pt-1 relative">
        <div className="relative flex items-center">
          {/* Milestone FND Flag */}
          {fnd > 0 && fnd <= maxRounds && (
            <div 
              className="absolute top-[-22px] -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${(fnd / maxRounds) * 100}%` }}
            >
              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[9px] font-bold whitespace-nowrap shadow">
                FND: R{fnd}
              </span>
              <div className="w-0.5 h-3 bg-amber-400" />
            </div>
          )}

          {/* Milestone HND Flag */}
          {hnd > 0 && hnd < maxRounds && (
            <div 
              className="absolute top-[-22px] -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${(hnd / maxRounds) * 100}%` }}
            >
              <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/50 text-[9px] font-bold whitespace-nowrap shadow">
                HND: R{hnd}
              </span>
              <div className="w-0.5 h-3 bg-purple-400" />
            </div>
          )}

          {/* Custom Stylized Range Track */}
          <input
            type="range"
            min={0}
            max={maxRounds}
            step={1}
            value={currentRound}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition-all focus:outline-none"
            style={{
              background: `linear-gradient(to right, #00E5FF 0%, #00E5FF ${progressPct}%, #1E293B ${progressPct}%, #1E293B 100%)`
            }}
          />
        </div>

        {/* Timeline Range Ticks */}
        <div className="flex justify-between text-[10px] text-slate-500 pt-0.5 px-0.5 font-mono">
          <button 
            onClick={() => jumpToRound(0)}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Round 0 (Genesis)
          </button>
          <button 
            onClick={() => jumpToRound(Math.floor(maxRounds * 0.25))}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Round {Math.floor(maxRounds * 0.25)}
          </button>
          <button 
            onClick={() => jumpToRound(Math.floor(maxRounds * 0.5))}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Round {Math.floor(maxRounds * 0.5)}
          </button>
          <button 
            onClick={() => jumpToRound(Math.floor(maxRounds * 0.75))}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Round {Math.floor(maxRounds * 0.75)}
          </button>
          <button 
            onClick={() => jumpToRound(maxRounds)}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Round {maxRounds} (Horizon)
          </button>
        </div>
      </div>

      {/* Control Buttons & Playback Speed Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          {/* Reset / Genesis */}
          <button
            onClick={() => {
              soundFX.playResetSound();
              restart();
              setTimeline10Stage(1);
            }}
            className="p-2 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer shadow-md"
            title="Reset to Genesis Round 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Previous Stage */}
          <button
            onClick={() => selectStage(Math.max(1, timeline10Stage - 1))}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
            title="Previous Stage"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Prev Stage</span>
          </button>

          {/* Step Backward -10 Rounds */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepBackward(10);
            }}
            className="px-2 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
            title="Step Back 10 Rounds"
          >
            -10 Rnds
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              if (isPlaying) pause();
              else play();
            }}
            className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:opacity-95 text-slate-950 shadow-cyan-500/25'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isPlaying ? 'PAUSE TIMELINE' : 'STREAM SIMULATION'}</span>
          </button>

          {/* Step Forward +10 Rounds */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepForward(10);
            }}
            className="px-2 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
            title="Step Forward 10 Rounds"
          >
            +10 Rnds
          </button>

          {/* Next Stage */}
          <button
            onClick={() => selectStage(Math.min(10, timeline10Stage + 1))}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1220] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
            title="Next Stage"
          >
            <span>Next Stage</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Speed Multipliers */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            SPEED:
          </span>
          <div className="flex items-center bg-[#0B1220] rounded-xl border border-[#1C3150] p-0.5">
            {[0.25, 0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundFX.playClickSound();
                  setPlaybackSpeed(spd);
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snapshot HUD Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#1C3150] text-[11px]">
        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Active Nodes
          </span>
          <span className="text-white font-extrabold text-sm">{telemetry.activeNodes}</span>
          <span className="text-[9px] text-slate-400 block">/ {telemetry.totalNodes} total</span>
        </div>

        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Dead Nodes
          </span>
          <span className={`font-extrabold text-sm ${telemetry.deadNodes > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {telemetry.deadNodes}
          </span>
          <span className="text-[9px] text-slate-400 block">{((telemetry.deadNodes / telemetry.totalNodes) * 100).toFixed(0)}% loss</span>
        </div>

        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-300" /> Avg Battery
          </span>
          <span className="text-cyan-300 font-extrabold text-sm">{telemetry.avgResidualEnergy.toFixed(3)} J</span>
          <span className="text-[9px] text-slate-400 block">{((telemetry.avgResidualEnergy / 0.5) * 100).toFixed(0)}% remaining</span>
        </div>

        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold">Field Coverage</span>
          <span className="text-cyan-400 font-extrabold text-sm">{telemetry.currentCoveragePct.toFixed(1)}%</span>
          <span className="text-[9px] text-emerald-400 block">Preserved (Δ≤1.0%)</span>
        </div>

        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold">Packets Delivered</span>
          <span className="text-amber-400 font-extrabold text-sm">{telemetry.packetsReceived.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block">PDR: {telemetry.deliveryRatio.toFixed(1)}%</span>
        </div>

        <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1C3150]/60">
          <span className="text-[9px] uppercase text-slate-500 block font-bold">Avg Routing Dist</span>
          <span className="text-blue-300 font-extrabold text-sm">{telemetry.averageRoutingDistance.toFixed(1)} m</span>
          <span className="text-[9px] text-slate-400 block">Latency: {telemetry.latencyMs} ms</span>
        </div>
      </div>
    </TiltCard3D>
  );
};
