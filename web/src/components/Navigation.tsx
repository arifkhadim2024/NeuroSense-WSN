import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, ShieldCheck, Sparkles, Hexagon, GitBranch, 
  Zap, BarChart3, Trophy, BookOpen, Code2, FileText,
  Volume2, VolumeX, Download, PlusCircle, HelpCircle, Brain,
  Play, Square, Maximize2, GraduationCap, Compass
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';

export type PrimaryTab = 
  | 'digital_twin'
  | 'coverage_lab'
  | 'optimization_lab'
  | 'clustering_lab'
  | 'routing_lab'
  | 'energy_lifetime'
  | 'analytics'
  | 'benchmark'
  | 'theory'
  | 'source_code'
  | 'research_guide';

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

  const navTabs: { id: PrimaryTab; num: string; name: string; icon: React.ElementType }[] = [
    { id: 'digital_twin', num: '01', name: 'Digital Twin', icon: Layers },
    { id: 'coverage_lab', num: '02', name: 'Coverage Lab', icon: ShieldCheck },
    { id: 'optimization_lab', num: '03', name: 'Optimization', icon: Sparkles },
    { id: 'clustering_lab', num: '04', name: 'Clustering', icon: Hexagon },
    { id: 'routing_lab', num: '05', name: 'Routing', icon: GitBranch },
    { id: 'energy_lifetime', num: '06', name: 'Energy & Lifetime', icon: Zap },
    { id: 'analytics', num: '07', name: 'Analytics', icon: BarChart3 },
    { id: 'benchmark', num: '08', name: 'Benchmark', icon: Trophy },
    { id: 'theory', num: '09', name: 'Theory', icon: BookOpen },
    { id: 'source_code', num: '10', name: 'Source Code', icon: Code2 },
    { id: 'research_guide', num: '11', name: 'Research Guide', icon: FileText }
  ];

  return (
    <nav className="fixed top-0 w-full bg-[#050912]/95 backdrop-blur-2xl z-50 border-b border-[#1C3150] shadow-2xl font-mono text-xs">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5">
        
        {/* Top Bar: Brand, Mode Switch, 12-Step Story, Presentation, Audio, Modals */}
        <div className="flex flex-wrap lg:flex-nowrap justify-between items-center py-2 gap-3 border-b border-[#1C3150]/60">
          
          {/* Left: Brand Logo & Title */}
          <motion.div 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => {
              soundFX.playClickSound();
              onSelectTab('digital_twin');
            }}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 glow-cyan">
              <Brain className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold tracking-wide text-white uppercase font-sans">
                  NEUROSENSE-WSN
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider hidden sm:inline-block">
                  ANN + PSO HYBRID
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-semibold tracking-tight">
                ANN-Driven Coverage Optimization &amp; PSO-Hybrid Routing
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

            {/* 12-Step Explain Simulation / Story Mode Tour */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onSelectTab('digital_twin');
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
              title="12-Step Guided Walkthrough of WSN Physics & AI Pipeline"
            >
              {isStoryPlaying || storyStep !== null ? (
                <>
                  <Square className="w-3 h-3 fill-current text-slate-950" />
                  <span>Step {storyStep || 1}/12</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-violet-400" />
                  <span>Explain (12 Steps)</span>
                </>
              )}
            </button>

            {/* Presentation Mode Toggle */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onSelectTab('digital_twin');
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

        {/* Bottom Bar: 11 Dedicated Numbered Tabs */}
        <div className="flex items-center space-x-1 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
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
                className={`px-3 py-1.5 text-xs rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-cyan-500/10 font-medium'
                }`}
              >
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'text-cyan-400/80 font-bold'
                }`}>
                  {tab.num}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
};


