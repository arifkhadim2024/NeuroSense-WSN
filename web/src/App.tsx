import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';
import { SimulationProvider } from './context/SimulationContext';
import { Navigation, type PrimaryTab } from './components/Navigation';

// Tab Views & Labs
import { HomeSimulationView } from './components/HomeSimulationView';
import { CoverageLab } from './components/CoverageLab';
import { CoverageAnalytics } from './components/CoverageAnalytics';
import { ANNNeuralLab } from './components/ANNNeuralLab';
import { OptimizationLab } from './components/OptimizationLab';
import { ClusteringLab } from './components/ClusteringLab';
import { VoronoiLab } from './components/VoronoiLab';
import { RoutingLab } from './components/RoutingLab';
import { RoutingProtocolsLab } from './components/RoutingProtocolsLab';
import { EnergyLifetimeLab } from './components/EnergyLifetimeLab';
import { EnergyAnalytics } from './components/EnergyAnalytics';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BenchmarkLab } from './components/BenchmarkLab';
import { AlgorithmComparison } from './components/AlgorithmComparison';
import { ResearchResults } from './components/ResearchResults';
import { ResearchTheory } from './components/ResearchTheory';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { MasterGuideViewer } from './components/MasterGuideViewer';

// Modals
import { ExperimentWizardModal } from './components/ExperimentWizardModal';
import { ExplainModal } from './components/ExplainModal';
import { ReportGeneratorModal } from './components/ReportGeneratorModal';
import { ScenarioManagerModal } from './components/ScenarioManagerModal';

function ResearchLabContent() {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('digital_twin');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Render the selected primary lab/tab (11 Dedicated Tabs)
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'digital_twin':
        return <HomeSimulationView />;
      case 'coverage_lab':
        return (
          <div className="space-y-8 animate-fadeIn">
            <CoverageLab />
            <CoverageAnalytics />
          </div>
        );
      case 'optimization_lab':
        return (
          <div className="space-y-8 animate-fadeIn">
            <ANNNeuralLab />
            <OptimizationLab />
          </div>
        );
      case 'clustering_lab':
        return (
          <div className="space-y-8 animate-fadeIn">
            <ClusteringLab />
            <VoronoiLab />
          </div>
        );
      case 'routing_lab':
        return (
          <div className="space-y-8 animate-fadeIn">
            <RoutingLab />
            <RoutingProtocolsLab />
          </div>
        );
      case 'energy_lifetime':
        return (
          <div className="space-y-8 animate-fadeIn">
            <EnergyLifetimeLab />
            <EnergyAnalytics />
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-8 animate-fadeIn">
            <AnalyticsDashboard />
          </div>
        );
      case 'benchmark':
        return (
          <div className="space-y-8 animate-fadeIn">
            <BenchmarkLab />
            <AlgorithmComparison />
            <ResearchResults />
          </div>
        );
      case 'theory':
        return (
          <div className="space-y-8 animate-fadeIn">
            <ResearchTheory />
          </div>
        );
      case 'source_code':
        return (
          <div className="space-y-8 animate-fadeIn">
            <SourceCodeViewer />
          </div>
        );
      case 'research_guide':
        return (
          <div className="space-y-8 animate-fadeIn">
            <MasterGuideViewer />
          </div>
        );
      default:
        return <HomeSimulationView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050912] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative overflow-x-hidden bg-lab-grid">
      
      {/* Top Laboratory Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNewExperiment={() => setIsWizardOpen(true)}
        onOpenExplain={() => setIsExplainOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Atmospheric Ambient Glows (Electric Cyan & Violet) */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 left-10 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Scenario Manager Modal */}
      <ScenarioManagerModal />

      {/* Experiment Wizard Modal */}
      <ExperimentWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Scientific Concept Explain Modal */}
      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
      />

      {/* Research Brief / Technical Guide PDF Modal */}
      <ReportGeneratorModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Main Container */}
      <main className="pt-28 pb-16 px-3 sm:px-6 relative z-10 max-w-[1700px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Futuristic Midnight Blue Research Laboratory Footer */}
      <footer className="py-8 px-4 bg-[#070B14] border-t border-[#1C3150] text-center font-mono relative z-10 text-xs text-slate-400">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">NEUROSENSE-WSN RESEARCH LAB</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">ANN + PSO-Hybrid Platform</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span>First-Order Radio Model (E_elec = 50 nJ/bit, d_0 = 87.7m)</span>
            <span>•</span>
            <span className="text-cyan-400/80 font-bold">100-Seed Academic Benchmark</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function App() {
  return (
    <SimulationProvider>
      <ResearchLabContent />
    </SimulationProvider>
  );
}

export default App;

