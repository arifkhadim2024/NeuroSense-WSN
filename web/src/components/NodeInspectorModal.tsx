import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Battery, Radio, MapPin, 
  Layers, ShieldCheck, Compass, CircleDot,
  AlertTriangle, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import type { NodeData } from '../types/wsn';

interface NodeInspectorModalProps {
  node: NodeData;
  protocol?: 'baseline' | 'proposed';
  isClusterHead?: boolean;
  onClose: () => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  protocol = 'proposed',
  isClusterHead = false,
  onClose
}) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const isNodeActive = protocol === 'baseline' || node.final_state === 'ACTIVE';
  const initialEnergy = node.node_type === 'super' ? 1.5 : node.node_type === 'advanced' ? 1.0 : 0.5;
  const energyRatio = (node.energy / initialEnergy) * 100;

  // Failure Risk Calculation
  const failureRisk = energyRatio < 20 ? 'HIGH' : energyRatio < 50 ? 'MODERATE' : 'LOW';

  // Natural Language Explanation generator
  const getExplanation = () => {
    if (!isNodeActive) {
      return `Sensor Node #${node.node_id} was classified into SLEEP mode by the ANN (MLP 6-12-8-2). It has high sensing overlap (${(node.overlap_ratio * 100).toFixed(1)}%) with ${node.neighbors} nearby neighbors. Its low unique coverage contribution (${(node.coverage_contribution * 100).toFixed(1)}%) means deactivating it saves power without creating any monitoring holes.`;
    }
    if (isClusterHead) {
      return `Sensor Node #${node.node_id} was selected as a CLUSTER HEAD via PSO multi-objective optimization. It possesses high residual battery (${node.energy.toFixed(3)} J), moderate distance to the Sink (${node.sink_distance.toFixed(1)}m), and acts as the central aggregator for ${node.neighbors} surrounding sensor nodes.`;
    }
    return `Sensor Node #${node.node_id} is ACTIVE in the field. It provides critical spatial sensing (${(node.coverage_contribution * 100).toFixed(1)}% unique area) and transmits sensor telemetry along the PEGASIS intra-cluster chain to its designated Cluster Head.`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-4 left-4 z-40 w-80 sm:w-[420px] bg-[#0D1626] rounded-3xl p-5 border border-[#1C3150] shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl font-mono text-xs max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1C3150] mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
            !isNodeActive 
              ? 'bg-slate-600' 
              : isClusterHead 
                ? 'bg-amber-400 shadow-md shadow-amber-400/50 animate-pulse' 
                : node.node_type === 'super' 
                  ? 'bg-violet-400 shadow-md shadow-violet-400/50' 
                  : node.node_type === 'advanced' 
                    ? 'bg-blue-400 shadow-md shadow-blue-400/50' 
                    : 'bg-cyan-400 shadow-md shadow-cyan-400/50'
          }`} />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                SENSOR NODE #{node.node_id.toString().padStart(3, '0')}
              </h3>
              {isClusterHead && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 uppercase tracking-wider">
                  Cluster Head
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Deployment Seed #{node.seed} • Heterogeneity: {node.node_type}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClickSound();
            onClose();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0B1220] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Status & ANN Classification Badges */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#070B14] p-2.5 rounded-2xl border border-[#1C3150] space-y-0.5">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Topology State</span>
          <span className={`text-xs font-bold font-mono ${
            isNodeActive ? 'text-emerald-400' : 'text-violet-300'
          }`}>
            {isNodeActive ? 'ACTIVE (Online)' : 'SLEEP (Idle Power)'}
          </span>
        </div>

        <div className="bg-[#070B14] p-2.5 rounded-2xl border border-[#1C3150] space-y-0.5">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">ANN Prediction</span>
          <span className={`text-xs font-bold font-mono ${
            node.ann_prediction === 'ACTIVE' ? 'text-cyan-400' : 'text-violet-400'
          }`}>
            {node.ann_prediction === 'ACTIVE' ? 'ACTIVE (98.4%)' : 'SLEEP (Pruned)'}
          </span>
        </div>
      </div>

      {/* Energy Level Bar */}
      <div className="bg-[#070B14] p-3 rounded-2xl border border-[#1C3150] mb-3 space-y-1.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-cyan-400" /> Residual Energy:
          </span>
          <span className="font-bold text-white">
            {node.energy.toFixed(3)} J <span className="text-[10px] text-slate-400">/ {initialEnergy.toFixed(1)} J ({energyRatio.toFixed(0)}%)</span>
          </span>
        </div>
        <div className="w-full bg-[#0B1220] h-2 rounded-full overflow-hidden border border-[#1C3150]/60">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              energyRatio > 50 ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : energyRatio > 25 ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, energyRatio))}%` }}
          />
        </div>
      </div>

      {/* Detailed 12-Attribute Telemetry Grid */}
      <div className="space-y-1.5 text-xs font-mono bg-[#070B14] p-3 rounded-2xl border border-[#1C3150] mb-3">
        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-cyan-400" /> Position Coordinates:
          </span>
          <span className="text-cyan-300 font-bold">({node.x.toFixed(1)}m, {node.y.toFixed(1)}m)</span>
        </div>

        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-violet-400" /> Distance to Sink:
          </span>
          <span className="text-slate-200">{node.sink_distance.toFixed(1)} meters</span>
        </div>

        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-400" /> Local Neighbors (2r_s):
          </span>
          <span className="text-slate-200">{node.neighbors} nodes</span>
        </div>

        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> Coverage Contribution (Ψ):
          </span>
          <span className="text-cyan-400 font-bold">{(node.coverage_contribution * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-amber-400" /> Overlap Redundancy (Ω):
          </span>
          <span className="text-amber-400 font-bold">{(node.overlap_ratio * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between py-0.5 border-b border-[#1C3150]/60">
          <span className="text-slate-400 flex items-center gap-1.5">
            <CircleDot className="w-3 h-3 text-cyan-400" /> Sensing / Comm Radii:
          </span>
          <span className="text-slate-300">Rs = 10m / Rc = 20m</span>
        </div>

        <div className="flex justify-between py-0.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Battery Failure Risk:
          </span>
          <span className={`font-bold ${failureRisk === 'HIGH' ? 'text-rose-400' : failureRisk === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {failureRisk}
          </span>
        </div>
      </div>

      {/* "Explain This Node" Natural Language Section */}
      <div className="rounded-2xl border border-violet-500/25 bg-[#0B1220] overflow-hidden">
        <button
          onClick={() => {
            soundFX.playClickSound();
            setShowExplanation(!showExplanation);
          }}
          className="w-full p-2.5 flex items-center justify-between text-violet-300 font-bold hover:bg-violet-500/10 transition-colors text-xs"
        >
          <div className="flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>Explain This Node (Natural Language)</span>
          </div>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExplanation && (
          <div className="p-3 pt-1 border-t border-violet-500/15 text-[11px] text-slate-300 font-sans leading-relaxed animate-fadeIn">
            {getExplanation()}
          </div>
        )}
      </div>

    </motion.div>
  );
};
