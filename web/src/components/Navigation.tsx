import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Grid, GitBranch, Code2, BookOpen,
  Volume2, VolumeX, Download, Brain,
  ChevronDown, FileSpreadsheet, FileJson, Image,
  Sparkles, Maximize2, GraduationCap, Compass
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
  onOpenNewExperiment?: () => void;
  onOpenExplain?: () => void;
  onOpenReport?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenReport
}) => {
  const {
    uiMode,
    setUIMode,
    isPresentationMode,
    setIsPresentationMode,
    exportTopologyCSV,
    exportTelemetryJSON,
    exportPublicationPNG,
    startResearchDemo,
    isResearchDemoActive
  } = useWSNSimulation();

  const [audioEnabled, setAudioEnabled] = useState<boolean>(soundFX.isAudioEnabled());
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return soundFX.subscribe((enabled) => setAudioEnabled(enabled));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAudioToggle = () => {
    soundFX.toggleAudio();
  };

  const navTabs: { id: PrimaryTab; num: string; name: string; subtitle: string; icon: React.ElementType }[] = [
    { id: 'simulation', num: '01', name: '3D Field Topology', subtitle: 'Spatial Simulation & Nodes', icon: Layers },
    { id: 'optimization', num: '02', name: 'Voronoi & Multiplicity', subtitle: 'Heatmaps & Polygons', icon: Grid },
    { id: 'routing', num: '03', name: 'Routing Protocols', subtitle: 'Benchmarks & Telemetry', icon: GitBranch },
    { id: 'results', num: '04', name: 'Algorithm Source', subtitle: 'Python Core Modules', icon: Code2 },
    { id: 'research', num: '05', name: 'Formulation & Theory', subtitle: 'Mathematical Proofs & Model', icon: BookOpen }
  ];

  return (
    <nav className="fixed top-0 w-full bg-[#050912]/95 backdrop-blur-2xl z-50 border-b border-[#1C3150] shadow-2xl font-mono text-xs">
      <div className="max-w-[1750px] mx-auto px-3 sm:px-5">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap lg:flex-nowrap justify-between items-center py-2.5 gap-3 border-b border-[#1C3150]/60">
          
          {/* Left: Brand Logo & Title */}
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
                  NEUROSENSE TOPOLOGY LAB
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider hidden sm:inline-block">
                  RESEARCH WORKBENCH
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-semibold tracking-tight">
                ANN Sensor Placement &bull; Overlap Elimination &bull; PSO-Hybrid Routing
              </div>
            </div>
          </motion.div>

          {/* Right Action Tools */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            
            {/* Export Research Dropdown Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setIsExportMenuOpen(!isExportMenuOpen);
                }}
                onMouseEnter={() => soundFX.playHoverSound()}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition-all text-xs cursor-pointer active:scale-95"
                title="Export Research Datasets, Telemetry and Publication Figures"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Export Research</span>
                <ChevronDown className="w-3 h-3 text-slate-950 ml-0.5" />
              </button>

              <AnimatePresence>
                {isExportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-[#090F1C]/98 backdrop-blur-xl border border-[#1C3150] rounded-2xl shadow-2xl p-2 z-50 overflow-hidden font-sans"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-[#1C3150]/60 mb-1">
                      Certified Research Exports
                    </div>

                    <button
                      onClick={() => {
                        exportTopologyCSV();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent flex items-start space-x-2.5 transition-all group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 font-mono">Topology Dataset (.CSV)</div>
                        <div className="text-[11px] text-slate-400">Node coordinates, battery, and cluster roles</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        exportTelemetryJSON();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-violet-500/10 hover:border-violet-500/30 border border-transparent flex items-start space-x-2.5 transition-all group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 group-hover:bg-violet-500 group-hover:text-slate-950 transition-colors">
                        <FileJson className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-violet-300 font-mono">Metrics Telemetry (.JSON)</div>
                        <div className="text-[11px] text-slate-400">CR, OR, HR, K, FND and scenario parameters</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        exportPublicationPNG();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent flex items-start space-x-2.5 transition-all group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Image className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 font-mono">Publication Figure (.PNG)</div>
                        <div className="text-[11px] text-slate-400">High-res canvas snapshot for LaTeX / IEEE</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 18-Step Automated Research Story Demo */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                onSelectTab('simulation');
                startResearchDemo();
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer ${
                isResearchDemoActive
                  ? 'bg-violet-500 text-slate-950 border-violet-400 shadow-lg shadow-violet-500/30'
                  : 'bg-[#111D33] hover:bg-[#162542] border-violet-500/40 text-violet-300'
              }`}
              title="18-Step Interactive Automated Research Demonstration Tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>{isResearchDemoActive ? 'Demo Active' : 'Research Demo (18 Steps)'}</span>
            </button>

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
              title={uiMode === 'beginner' ? 'Switch to Advanced Research Mode' : 'Switch to Simplified Beginner Mode'}
            >
              {uiMode === 'beginner' ? (
                <>
                  <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Beginner</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research</span>
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
              title="Toggle Fullscreen Presentation View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Presentation</span>
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={handleAudioToggle}
              className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                audioEnabled 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25' 
                  : 'bg-[#0B1220] border-[#1C3150] text-slate-400 hover:bg-[#111D33]'
              }`}
              title={audioEnabled ? 'Mute Synthesized Audio Feedback' : 'Enable Synthesized Audio Feedback'}
            >
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden md:inline">Audio</span>
            </button>

            {/* Technical Guide PDF / Report Button */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                if (onOpenReport) onOpenReport();
              }}
              onMouseEnter={() => soundFX.playHoverSound()}
              className="px-2.5 py-1.5 bg-[#0B1220] hover:bg-[#111D33] border border-cyan-500/30 text-cyan-300 font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all text-xs cursor-pointer"
              title="Download / Inspect Master Technical Guide PDF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Technical Guide PDF</span>
            </button>

            {/* Engine Status Online Pill */}
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-bold flex items-center space-x-1.5 text-xs shadow-inner hidden sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-mono font-bold">
                ENGINE ONLINE
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
