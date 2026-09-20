import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, Sparkles, GitBranch, Trophy, BookOpen,
  Volume2, VolumeX, Download, PlusCircle, HelpCircle, Brain,
  Play, Square, Maximize2, GraduationCap, Compass
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';

export type PrimaryTab = 
  | 'simulation'
  | 'optimization'
  | 'routing'
  | 'results'
  | 'research';

interface NavigationProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  onOpenNewExperiment: () => void;
  onOpenExplain: () => void;
  onOpenReport: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewExperiment,
  onOpenExplain,
  onOpenReport
}) => {
  const {
    uiMode,
    setUIMode,
    isPresentationMode,
    setIsPresentationMode,
    isStoryPlaying,
    storyStep,
    startStoryMode,
    stopStoryMode
  } = useWSNSimulation();

  const [audioEnabled, setAudioEnabled] = useState<boolean>(soundFX.isAudioEnabled());

  useEffect(() => {
    return soundFX.subscribe((enabled) => setAudioEnabled(enabled));
  }, []);

  const handleAudioToggle = () => {
    soundFX.toggleAudio();
  };

  const navTabs: { id: PrimaryTab; num: string; name: string; subtitle: string; icon: React.ElementType }[] = [
    { id: 'simulation', num: '01', name: 'Simulation', subtitle: 'Hero Digital Twin', icon: Layers },
    { id: 'optimization', num: '02', name: 'Optimization', subtitle: 'ANN + PSO Swarm', icon: Sparkles },
    { id: 'routing', num: '03', name: 'Routing', subtitle: 'LEACH / PEGASIS / Hybrid', icon: GitBranch },
    { id: 'results', num: '04', name: 'Results', subtitle: 'Benchmarks & Telemetry', icon: Trophy },
    { id: 'research', num: '05', name: 'Research', subtitle: 'Theory, Code & Guide', icon: BookOpen }
  ];

  return (
    <nav className="fixed top-0 w-full bg-[#050912]/95 backdrop-blur-2xl z-50 border-b border-[#1C3150] shadow-2xl font-mono text-xs">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5">
        
        {/* Top Bar: Brand, Mode Switch, 9-Step Story, Presentation, Audio, Modals */}
        <div className="flex flex-wrap lg:flex-nowrap justify-between items-center py-2.5 gap-3 border-b border-[#1C3150]/60">
          
          {/* Left: Brand Logo & Thesis Title */}
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer shrink-0"
            onClick={() => {
              soundFX.playClickSound();
              onSelectTab('simulation');
            }}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 glow-cyan">
              <Brain className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold tracking-wide text-white uppercase font-sans">
                  NEUROSENSE-WSN
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider hidden sm:inline-block">
                  ANN + PSO-HYBRID
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-semibold tracking-tight">
                ANN Sensor Placement &bull; Overlap Elimination &bull; Energy-Aware Routing
              </div>
            </div>
          </motion.div>

          {/* Right Action Tools */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            
            {/* Beginner vs Research Mode Toggle */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setUIMode(uiMode === 'beginner' ? 'research' : 'beginner');
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer ${
                uiMode === 'beginner'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 shadow-md shadow-cyan-500/10'
              }`}
              title={uiMode === 'beginner' ? 'Switch to Advanced Research Mode (Full Math & Raw Metrics)' : 'Switch to Simplified Beginner Mode'}
            >
              {uiMode === 'beginner' ? (
                <>
                  <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Beginner Mode</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research Mode</span>
                </>
              )}
            </button>

            {/* 9-Step Explain Research Story Tour */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onSelectTab('simulation');
                if (isStoryPlaying || storyStep !== null) {
                  stopStoryMode();
                } else {
                  startStoryMode();
                }
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer ${
                isStoryPlaying || storyStep !== null
                  ? 'bg-violet-500 text-slate-950 border-violet-400 shadow-lg shadow-violet-500/30'
                  : 'bg-[#111D33] hover:bg-[#162542] border-violet-500/40 text-violet-300'
              }`}
              title="9-Step Guided Presentation Sequence of the Core Research Story"
            >
              {isStoryPlaying || storyStep !== null ? (
                <>
                  <Square className="w-3 h-3 fill-current text-slate-950" />
                  <span>Step {storyStep || 1}/9</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-violet-400" />
                  <span>Explain (9 Steps)</span>
                </>
              )}
            </button>

            {/* Presentation Mode Toggle */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onSelectTab('simulation');
                setIsPresentationMode(!isPresentationMode);
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className={`px-2.5 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer ${
                isPresentationMode
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                  : 'bg-[#0B1220] hover:bg-[#111D33] border-[#1C3150] text-slate-300'
              }`}
              title="Toggle Fullscreen Presentation View (Viva/Defense Ready)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Presentation</span>
            </button>

            {/* New Experiment Wizard Button */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onOpenNewExperiment();
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition-all text-xs active:scale-95 cursor-pointer"
              title="Launch Experiment Configurator"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden md:inline">New Experiment</span>
              <span className="md:hidden">New</span>
            </button>

            {/* Explain Concepts Modal */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onOpenExplain();
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className="px-2.5 py-1.5 bg-[#111D33] hover:bg-[#162542] border border-[#1C3150] text-slate-300 hover:text-white font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all text-xs cursor-pointer"
              title="Open Scientific Concept Encyclopedia"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">Concepts</span>
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={handleAudioToggle}
              className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                audioEnabled 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25' 
                  : 'bg-[#0B1220] border-[#1C3150] text-slate-400 hover:bg-[#111D33]'
              }`}
              title={audioEnabled ? 'Mute Audio Feedback' : 'Enable Audio Feedback'}
            >
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Technical Guide PDF / Report Button */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onOpenReport();
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className="px-2.5 py-1.5 bg-[#0B1220] hover:bg-[#111D33] border border-cyan-500/30 text-cyan-300 font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all text-xs cursor-pointer"
              title="Open Technical Research Brief & PDF Export"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">PDF</span>
            </button>

            {/* Engine Status Online Pill */}
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-bold flex items-center space-x-1.5 text-xs shadow-inner hidden sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-mono font-bold">
                ONLINE
              </span>
            </div>

          </div>

        </div>

        {/* Bottom Bar: 5 Primary Navigation Tabs */}
        <div className="flex items-center space-x-2 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.playClickSound();
                  onSelectTab(tab.id);
                }}
                onMouseEnter={() => soundFX.playHoverSound()}
                className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center space-x-2.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-slate-950 shadow-lg shadow-cyan-500/25 font-black' 
                    : 'bg-[#0B1220]/80 text-slate-400 hover:text-white hover:bg-[#111D33] border border-[#1C3150]/60 font-medium'
                }`}
              >
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-[#070B14] text-cyan-400 border border-cyan-500/20'
                }`}>
                  {tab.num}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <div className="flex flex-col text-left">
                  <span className="leading-tight font-bold">{tab.name}</span>
                  <span className={`text-[9px] font-sans ${isActive ? 'text-slate-900/80 font-semibold' : 'text-slate-500'}`}>
                    {tab.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
};


