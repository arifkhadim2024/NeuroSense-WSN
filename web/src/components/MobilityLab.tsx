import React, { useState } from 'react';
import { 
  Navigation as NavIcon, Compass, ArrowRight
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const MobilityLab: React.FC = () => {
  const { activeScenario, nodes } = useWSNSimulation();
  const [mobilityMode, setMobilityMode] = useState<'static' | 'uav_sink' | 'random_walk'>('static');
  const [uavSpeed, setUavSpeed] = useState<number>(5.0); // m/s
  const [trajectoryStep, setTrajectoryStep] = useState<number>(0);

  // Predefined UAV Mobile Sink Waypoints around the field perimeter and center
  const uavWaypoints = [
    { x: 50, y: 50, name: 'Center Hover Point' },
    { x: 20, y: 20, name: 'South-West Zone' },
    { x: 20, y: 80, name: 'North-West Zone' },
    { x: 80, y: 80, name: 'North-East Zone' },
    { x: 80, y: 20, name: 'South-East Zone' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Compass className="w-3.5 h-3.5" />
          Kinematic Node Mobility &amp; UAV Sink Trajectory Architecture
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
          Sensor Mobility &amp; UAV Trajectory Lab
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Explore mobile sink path planning, kinematic energy dissipation overhead, dynamic topology updates, and future mobile sensor integrations.
        </p>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0D1626] p-3 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl shadow-cyan-950/20">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobilityMode('static')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              mobilityMode === 'static'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Static Research Deployment
          </button>
          <button
            onClick={() => setMobilityMode('uav_sink')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              mobilityMode === 'uav_sink'
                ? 'bg-violet-500 text-white font-bold shadow-md shadow-violet-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            UAV Mobile Sink Trajectory
          </button>
          <button
            onClick={() => setMobilityMode('random_walk')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              mobilityMode === 'random_walk'
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Random Waypoint Mobility (RWM)
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-400">UAV Velocity:</span>
          <input
            type="range"
            min="1"
            max="15"
            value={uavSpeed}
            onChange={(e) => setUavSpeed(Number(e.target.value))}
            className="w-24 accent-violet-400"
          />
          <span className="text-violet-300 font-bold">{uavSpeed} m/s</span>
        </div>
      </div>

      {/* Trajectory Simulation & Architecture View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Left: 2D Trajectory Map */}
        <div className="lg:col-span-2 bg-[#0D1626] rounded-3xl p-6 border border-[#1C3150] space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
            <span className="font-bold text-white flex items-center gap-2">
              <NavIcon className="w-4 h-4 text-violet-400" />
              Dynamic Spatial Trajectory Map (Field: {activeScenario.fieldWidth}m × {activeScenario.fieldHeight}m)
            </span>
            <span className="text-violet-400 text-xs font-bold">
              Mode: {mobilityMode.toUpperCase()}
            </span>
          </div>

          <div className="relative w-full aspect-square max-h-[500px] mx-auto bg-[#070B14] rounded-2xl border border-[#1C3150] overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Static Sensor Nodes */}
              {nodes.map((n) => (
                <circle
                  key={n.node_id}
                  cx={n.x}
                  cy={100 - n.y}
                  r={1.2}
                  fill={n.isAlive ? '#00E5FF' : '#EF4444'}
                  opacity={n.isAlive ? 0.8 : 0.2}
                />
              ))}

              {/* UAV Waypoint Trajectory Loop */}
              {mobilityMode === 'uav_sink' && (
                <g>
                  {/* Flight Path Polyline */}
                  <polygon
                    points="50,50 20,80 20,20 80,20 80,80"
                    fill="rgba(139, 92, 246, 0.08)"
                    stroke="#8B5CF6"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />

                  {/* Waypoints */}
                  {uavWaypoints.map((wp, i) => (
                    <g key={i}>
                      <circle cx={wp.x} cy={100 - wp.y} r={2.5} fill="#8B5CF6" stroke="#ffffff" strokeWidth="0.5" />
                      <text x={wp.x} y={100 - wp.y - 3} fill="#c084fc" fontSize="2.5" textAnchor="middle" fontWeight="bold">
                        WP{i + 1}
                      </text>
                    </g>
                  ))}

                  {/* Simulated Mobile UAV Sink */}
                  <circle
                    cx={uavWaypoints[trajectoryStep % uavWaypoints.length].x}
                    cy={100 - uavWaypoints[trajectoryStep % uavWaypoints.length].y}
                    r={5}
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="animate-pulse"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Stepper */}
          {mobilityMode === 'uav_sink' && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400">Active Waypoint: <strong className="text-violet-300">{uavWaypoints[trajectoryStep % uavWaypoints.length].name}</strong></span>
              <button
                onClick={() => setTrajectoryStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-400 transition-all flex items-center gap-1.5 shadow-md shadow-violet-500/25"
              >
                <span>Advance UAV Flight Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Kinematic Models & Specifications */}
        <div className="space-y-4">
          <div className="bg-[#0D1626] rounded-3xl p-6 border border-[#1C3150] space-y-4 shadow-xl">
            <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
              Kinematic Mobility Equations
            </span>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#070B14] rounded-xl border border-violet-500/20 text-violet-300 space-y-1">
                <span className="font-bold block text-white text-[11px]">UAV Mechanical Propulsion Cost</span>
                <div>P_mob(v) = P_0 · (1 + 3v² / U_tip²) + P_i · (sqrt(1 + v⁴ / 4v_0⁴) - v² / 2v_0²)¹/² + 1/2 · d_0 · ρ · s · A · v³</div>
              </div>

              <div className="p-3 bg-[#070B14] rounded-xl border border-cyan-500/20 text-cyan-300 space-y-1">
                <span className="font-bold block text-white text-[11px]">Dynamic Cluster Head Link Adaptation</span>
                <div>d(CH, Sink(t)) = sqrt((x_CH - x_sink(t))² + (y_CH - y_sink(t))² + H_uav²)</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-sans pt-2 border-t border-[#1C3150]">
              Mobile sinks shorten transmission distances for isolated edge clusters, eliminating hot-spot bottlenecks around fixed base station locations.
            </p>
          </div>

          <div className="bg-[#0D1626] rounded-2xl p-4 border border-[#1C3150] space-y-2">
            <span className="text-cyan-400 font-bold text-[11px] block">
              Static vs. Dynamic Network Baseline
            </span>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              The primary empirical baseline in this repository adopts static sensor nodes with fixed base station at (50, 150) to ensure reproducible 100-seed benchmark comparison.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
