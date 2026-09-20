import React from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Rewind, 
  Activity, Zap, ShieldAlert, Cpu
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';

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
    selectedProtocol
  } = useWSNSimulation();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetRound = parseInt(e.target.value, 10);
    jumpToRound(targetRound);
  };

  const fnd = telemetry.firstNodeDeadRound || 425;
  const hnd = telemetry.halfNodeDeadRound || 1000;
  const progressPct = (currentRound / maxRounds) * 100;

  return (
    <TiltCard3D 
      intensity={3}
      className="lab-card rounded-3xl p-4 sm:p-5 border border-[#1C3150] bg-[#070B14]/95 backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs text-slate-300"
    >
      {/* Header: Status Bar & Timeline Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                RESEARCH SIMULATION TIMELINE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
                {selectedProtocol.replace('_', '-').toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Continuous state synchronization • Scrub or step across {maxRounds} physical operational rounds.
            </div>
          </div>
        </div>

        {/* Current Round Display Badge */}
        <div className="flex items-center space-x-3 bg-[#0B1220] px-3.5 py-1.5 rounded-2xl border border-[#1C3150] shadow-inner">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
              CURRENT ROUND
            </span>
            <span className="text-base font-black text-cyan-400">
              {currentRound} <span className="text-slate-500 text-xs font-normal">/ {maxRounds}</span>
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
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
            }}
            className="p-2 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer shadow-md"
            title="Reset to Round 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step Backward -10 */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepBackward(10);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
            title="Step Back 10 Rounds"
          >
            <Rewind className="w-3 h-3" />
            <span>-10</span>
          </button>

          {/* Step Backward -1 */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepBackward(1);
            }}
            className="px-2 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
            title="Step Back 1 Round"
          >
            -1
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

          {/* Step Forward +1 */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepForward(1);
            }}
            className="px-2 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
            title="Step Forward 1 Round"
          >
            +1
          </button>

          {/* Step Forward +10 */}
          <button
            onClick={() => {
              soundFX.playClickSound();
              stepForward(10);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
            title="Step Forward 10 Rounds"
          >
            <span>+10</span>
            <FastForward className="w-3 h-3" />
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
