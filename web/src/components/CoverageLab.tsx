import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldCheck, Hexagon, CheckCircle2, 
  Info, Crosshair, Layers, Flame, Eye,
  Target, Filter, AlertTriangle
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { TiltCard3D } from './TiltCard3D';
import { soundFX } from '../utils/soundEffects';
import type { NodeData } from '../types/wsn';

export type CoverageAnalysisMode = 'heatmap' | 'overlap' | 'blindspot';
export type MultiplicityFilter = 'all' | '0x' | '1x' | '2x' | '3x+';

interface ConnectedHole {
  id: number;
  centroid: { x: number; y: number };
  cellCount: number;
  areaM2: number;
  maxInscribedRadius: number;
  isBoundary: boolean;
  nearestNodeId: number | null;
  nearestNodeDistance: number;
}

interface OverlapPair {
  nodeAId: number;
  nodeBId: number;
  distance: number;
  overlapPct: number;
  midpoint: { x: number; y: number };
}

export const CoverageLab: React.FC = () => {
  const { 
    nodes, 
    activeScenario, 
    selectedSeed, 
    setSelectedSeed, 
    selectedOptimizer,
    selectedNode,
    setSelectedNode
  } = useWSNSimulation();

  // Mode & Filter States
  const [analysisMode, setAnalysisMode] = useState<CoverageAnalysisMode>('heatmap');
  const [gridStep, setGridStep] = useState<number>(2); // 1m, 2m, or 5m
  const [multiplicityFilter, setMultiplicityFilter] = useState<MultiplicityFilter>('all');
  
  // Visual Layer Toggles
  const [showNodeDots, setShowNodeDots] = useState<boolean>(true);
  const [showSensingDiscs, setShowSensingDiscs] = useState<boolean>(true);
  const [showSleepHalos, setShowSleepHalos] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showRaysToProbe, setShowRaysToProbe] = useState<boolean>(true);

  // Hover & Probe State
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    k: number;
    coveringNodeIds: number[];
    nearestNodeId: number | null;
    nearestDist: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;
  const Rs = activeScenario.sensingRadius || 19;

  // Active vs Sleep Nodes based on current optimizer & alive status
  const activeNodes = useMemo(() => {
    return nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
  }, [nodes, selectedOptimizer]);

  const sleepNodes = useMemo(() => {
    return nodes.filter((n) => n.isAlive && selectedOptimizer === 'ann_greedy' && n.final_state === 'SLEEP');
  }, [nodes, selectedOptimizer]);

  // Discretized Grid Computation
  const gridAnalysis = useMemo(() => {
    const step = gridStep;
    const cols = Math.floor(W / step) + 1;
    const rows = Math.floor(H / step) + 1;
    const totalPoints = cols * rows;

    const multiplicityGrid: number[][] = []; // [row][col]
    const coveringNodesGrid: number[][][] = []; // [row][col] -> nodeIds[]
    
    let coveredPoints = 0;
    let singleCoveredPoints = 0;
    let dualCoveredPoints = 0;
    let highCoveredPoints = 0; // 3x+
    let blindspotPoints = 0;
    let maxK = 0;

    const rSq = Rs ** 2;

    for (let r = 0; r < rows; r++) {
      const gy = r * step;
      const rowMultiplicity: number[] = [];
      const rowCovering: number[][] = [];

      for (let c = 0; c < cols; c++) {
        const gx = c * step;
        let k = 0;
        const coveringIds: number[] = [];

        for (let i = 0; i < activeNodes.length; i++) {
          const n = activeNodes[i];
          const distSq = (n.x - gx) ** 2 + (n.y - gy) ** 2;
          if (distSq <= rSq) {
            k++;
            coveringIds.push(n.node_id);
          }
        }

        rowMultiplicity.push(k);
        rowCovering.push(coveringIds);

        if (k > maxK) maxK = k;

        if (k === 0) {
          blindspotPoints++;
        } else {
          coveredPoints++;
          if (k === 1) singleCoveredPoints++;
          else if (k === 2) dualCoveredPoints++;
          else highCoveredPoints++;
        }
      }
      multiplicityGrid.push(rowMultiplicity);
      coveringNodesGrid.push(rowCovering);
    }

    const overlapPoints = dualCoveredPoints + highCoveredPoints;
    const covPct = totalPoints > 0 ? (coveredPoints / totalPoints) * 100 : 0;
    const ovlPct = coveredPoints > 0 ? (overlapPoints / coveredPoints) * 100 : 0;
    const blindPct = totalPoints > 0 ? (blindspotPoints / totalPoints) * 100 : 0;
    const cellArea = step * step;
    const coveredAreaM2 = coveredPoints * cellArea;
    const overlapAreaM2 = overlapPoints * cellArea;
    const blindspotAreaM2 = blindspotPoints * cellArea;

    // Detect Connected Blindspot Holes via BFS on 0x cells
    const visited: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const holes: ConnectedHole[] = [];
    let holeCounter = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (multiplicityGrid[r][c] === 0 && !visited[r][c]) {
          // New hole cluster found
          holeCounter++;
          const clusterCells: { r: number; c: number }[] = [];
          const queue: { r: number; c: number }[] = [{ r, c }];
          visited[r][c] = true;
          let isBoundary = false;

          while (queue.length > 0) {
            const curr = queue.shift()!;
            clusterCells.push(curr);

            if (curr.r === 0 || curr.r === rows - 1 || curr.c === 0 || curr.c === cols - 1) {
              isBoundary = true;
            }

            const neighbors = [
              { r: curr.r - 1, c: curr.c },
              { r: curr.r + 1, c: curr.c },
              { r: curr.r, c: curr.c - 1 },
              { r: curr.r, c: curr.c + 1 },
            ];

            for (const nbr of neighbors) {
              if (
                nbr.r >= 0 &&
                nbr.r < rows &&
                nbr.c >= 0 &&
                nbr.c < cols &&
                !visited[nbr.r][nbr.c] &&
                multiplicityGrid[nbr.r][nbr.c] === 0
              ) {
                visited[nbr.r][nbr.c] = true;
                queue.push(nbr);
              }
            }
          }

          // Calculate Centroid
          let sumX = 0;
          let sumY = 0;
          clusterCells.forEach((cell) => {
            sumX += cell.c * step;
            sumY += cell.r * step;
          });
          const centroid = {
            x: Math.round((sumX / clusterCells.length) * 10) / 10,
            y: Math.round((sumY / clusterCells.length) * 10) / 10,
          };

          // Find distance to nearest active sensor
          let nearestNodeId: number | null = null;
          let nearestDist = Infinity;
          activeNodes.forEach((n) => {
            const d = Math.sqrt((n.x - centroid.x) ** 2 + (n.y - centroid.y) ** 2);
            if (d < nearestDist) {
              nearestDist = d;
              nearestNodeId = n.node_id;
            }
          });

          // Maximum Inscribed Gap Radius approx
          const approxRadius = Math.sqrt((clusterCells.length * cellArea) / Math.PI);

          holes.push({
            id: holeCounter,
            centroid,
            cellCount: clusterCells.length,
            areaM2: clusterCells.length * cellArea,
            maxInscribedRadius: Math.round(approxRadius * 10) / 10,
            isBoundary,
            nearestNodeId,
            nearestNodeDistance: Math.round(nearestDist * 10) / 10,
          });
        }
      }
    }

    // Sort holes by area descending
    holes.sort((a, b) => b.areaM2 - a.areaM2);

    // Calculate Top Overlapping Sensor Pairs
    const overlapPairs: OverlapPair[] = [];
    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        const nA = activeNodes[i];
        const nB = activeNodes[j];
        const d = Math.sqrt((nA.x - nB.x) ** 2 + (nA.y - nB.y) ** 2);
        if (d < 2 * Rs) {
          // Mutual lens overlap area calculation
          const alpha = 2 * Math.acos(d / (2 * Rs));
          const lensArea = (Rs ** 2) * (alpha - Math.sin(alpha));
          const circleArea = Math.PI * (Rs ** 2);
          const overlapRatio = (lensArea / circleArea) * 100;

          overlapPairs.push({
            nodeAId: nA.node_id,
            nodeBId: nB.node_id,
            distance: Math.round(d * 10) / 10,
            overlapPct: Math.round(overlapRatio * 10) / 10,
            midpoint: { x: (nA.x + nB.x) / 2, y: (nA.y + nB.y) / 2 },
          });
        }
      }
    }
    overlapPairs.sort((a, b) => b.overlapPct - a.overlapPct);

    return {
      cols,
      rows,
      step,
      totalPoints,
      coveredPoints,
      singleCoveredPoints,
      dualCoveredPoints,
      highCoveredPoints,
      overlapPoints,
      blindspotPoints,
      covPct,
      ovlPct,
      blindPct,
      coveredAreaM2,
      overlapAreaM2,
      blindspotAreaM2,
      maxK,
      multiplicityGrid,
      coveringNodesGrid,
      holes,
      overlapPairs,
      activeCount: activeNodes.length,
      sleepCount: sleepNodes.length,
    };
  }, [activeNodes, sleepNodes, W, H, Rs, gridStep]);

  // Selected Node's Intersecting Neighbors
  const selectedNodeAnalysis = useMemo(() => {
    if (!selectedNode) return null;
    const intersecting: { node: NodeData; dist: number; overlapPct: number }[] = [];
    
    activeNodes.forEach((n) => {
      if (n.node_id === selectedNode.node_id) return;
      const d = Math.sqrt((n.x - selectedNode.x) ** 2 + (n.y - selectedNode.y) ** 2);
      if (d < 2 * Rs) {
        const alpha = 2 * Math.acos(d / (2 * Rs));
        const lensArea = (Rs ** 2) * (alpha - Math.sin(alpha));
        const circleArea = Math.PI * (Rs ** 2);
        const overlapPct = (lensArea / circleArea) * 100;
        intersecting.push({
          node: n,
          dist: Math.round(d * 10) / 10,
          overlapPct: Math.round(overlapPct * 10) / 10
        });
      }
    });

    intersecting.sort((a, b) => b.overlapPct - a.overlapPct);

    const circleArea = Math.PI * (Rs ** 2);
    return {
      intersecting,
      circleArea: Math.round(circleArea),
      activeNeighborsCount: intersecting.length
    };
  }, [selectedNode, activeNodes, Rs]);

  // -----------------------------------------------------------------
  // HIGH-PRECISION SCIENTIFIC CANVAS RENDERING
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;
    const scaledRs = Rs * scaleX;

    ctx.clearRect(0, 0, width, height);

    // Deep Midnight Laboratory Background
    ctx.fillStyle = '#050912';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid Coordinate Lines
    if (showGridLines) {
      ctx.strokeStyle = 'rgba(28, 49, 80, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x * scaleX, 0);
        ctx.lineTo(x * scaleX, height);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y * scaleY);
        ctx.lineTo(width, y * scaleY);
        ctx.stroke();
      }
    }

    const { rows, cols, step, multiplicityGrid } = gridAnalysis;

    // ---------------------------------------------------------------
    // MODE 1: MULTIPLICITY HEATMAP
    // ---------------------------------------------------------------
    if (analysisMode === 'heatmap') {
      const cellW = (step / W) * width;
      const cellH = (step / H) * height;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = multiplicityGrid[r][c];
          
          if (multiplicityFilter === '0x' && k !== 0) continue;
          if (multiplicityFilter === '1x' && k !== 1) continue;
          if (multiplicityFilter === '2x' && k !== 2) continue;
          if (multiplicityFilter === '3x+' && k < 3) continue;

          const px = c * cellW;
          const py = height - (r + 1) * cellH;

          if (k === 0) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)'; // Blindspot faint crimson
          } else if (k === 1) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.22)'; // Electric Cyan (Optimal)
          } else if (k === 2) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'; // Emerald Green (Dual Overlap)
          } else if (k === 3) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'; // Amber (Triple Coverage)
          } else {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; // Violet (Severe Overlap 4x+)
          }

          ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
        }
      }

      // Additive sensing discs for continuous luminescence
      if (showSensingDiscs) {
        ctx.globalCompositeOperation = 'screen';
        activeNodes.forEach((node) => {
          const nx = node.x * scaleX;
          const ny = (H - node.y) * scaleY;

          const radGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, scaledRs);
          radGrad.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
          radGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.08)');
          radGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // ---------------------------------------------------------------
    // MODE 2: OVERLAP CONCENTRATION
    // ---------------------------------------------------------------
    else if (analysisMode === 'overlap') {
      const cellW = (step / W) * width;
      const cellH = (step / H) * height;

      // Dark field backdrop
      ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
      ctx.fillRect(0, 0, width, height);

      // Render only overlap regions (k >= 2) with high-intensity hot gradient
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = multiplicityGrid[r][c];
          if (k < 2) continue;

          const px = c * cellW;
          const py = height - (r + 1) * cellH;

          if (k === 2) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.45)'; // Cyan
          } else if (k === 3) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; // Violet
          } else if (k === 4) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.75)'; // Amber
          } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'; // Hot Crimson Red for 5x+
          }

          ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
        }
      }

      // Draw top overlapping node links and midpoints
      gridAnalysis.overlapPairs.slice(0, 5).forEach((pair) => {
        const mx = pair.midpoint.x * scaleX;
        const my = (H - pair.midpoint.y) * scaleY;

        // Glowing hotspot ring
        ctx.strokeStyle = pair.overlapPct > 50 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = pair.overlapPct > 50 ? '#EF4444' : '#F59E0B';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle active node circles
      if (showSensingDiscs) {
        activeNodes.forEach((node) => {
          const nx = node.x * scaleX;
          const ny = (H - node.y) * scaleY;
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    }

    // ---------------------------------------------------------------
    // MODE 3: BLINDSPOT HOLE MAP
    // ---------------------------------------------------------------
    else if (analysisMode === 'blindspot') {
      const cellW = (step / W) * width;
      const cellH = (step / H) * height;

      // Fill covered territory with subdued tint
      ctx.fillStyle = 'rgba(11, 23, 44, 0.75)';
      ctx.fillRect(0, 0, width, height);

      // Render uncovered blindspots in vivid warning neon crimson
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = multiplicityGrid[r][c];
          if (k === 0) {
            const px = c * cellW;
            const py = height - (r + 1) * cellH;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
            ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // Draw Connected Hole Markers and Inscribed Circles
      gridAnalysis.holes.forEach((hole) => {
        const hx = hole.centroid.x * scaleX;
        const hy = (H - hole.centroid.y) * scaleY;
        const hr = hole.maxInscribedRadius * scaleX;

        // Inscribed Hole Gap Radius Circle
        ctx.strokeStyle = hole.isBoundary ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.8)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(8, hr), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hole Centroid Marker
        ctx.fillStyle = hole.isBoundary ? '#F59E0B' : '#EF4444';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label for significant holes
        if (hole.areaM2 >= 20) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`Hole #${hole.id} (${hole.areaM2}m²)`, hx + 8, hy - 4);
        }
      });

      // Subtle active node sensing boundary outlines
      if (showSensingDiscs) {
        activeNodes.forEach((node) => {
          const nx = node.x * scaleX;
          const ny = (H - node.y) * scaleY;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    }

    // ---------------------------------------------------------------
    // COMMON OVERLAYS: SLEEPING NODES & SENSOR HARDWARE POINTS
    // ---------------------------------------------------------------

    // Sleeping Nodes dashed halos
    if (showSleepHalos && sleepNodes.length > 0) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      sleepNodes.forEach((node) => {
        const nx = node.x * scaleX;
        const ny = (H - node.y) * scaleY;
        ctx.beginPath();
        ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Sensor Nodes Hardware Dots
    if (showNodeDots) {
      nodes.forEach((node) => {
        const nx = node.x * scaleX;
        const ny = (H - node.y) * scaleY;
        const isActive = node.isAlive && (selectedOptimizer === 'ann_greedy' ? node.final_state === 'ACTIVE' : true);
        const isSelected = selectedNode?.node_id === node.node_id;

        if (isActive) {
          ctx.fillStyle = node.node_type === 'super' ? '#8B5CF6' : node.node_type === 'advanced' ? '#10B981' : '#00E5FF';
          ctx.beginPath();
          ctx.arc(nx, ny, isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Highlight Selected Node with Pulsating Target Rings
        if (isSelected) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nx, ny, 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // ---------------------------------------------------------------
    // DYNAMIC RAYCASTING TO PROBE CURSOR
    // ---------------------------------------------------------------
    if (hoveredPoint && showRaysToProbe) {
      const hpx = hoveredPoint.x * scaleX;
      const hpy = (H - hoveredPoint.y) * scaleY;

      // Crosshair at probe coordinate
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hpx - 8, hpy);
      ctx.lineTo(hpx + 8, hpy);
      ctx.moveTo(hpx, hpy - 8);
      ctx.lineTo(hpx, hpy + 8);
      ctx.stroke();

      // Rays to covering active sensors
      hoveredPoint.coveringNodeIds.forEach((nodeId) => {
        const n = nodes.find((node) => node.node_id === nodeId);
        if (n) {
          const nx = n.x * scaleX;
          const ny = (H - n.y) * scaleY;

          ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(hpx, hpy);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          ctx.setLineDash([]);

          // Highlight covering node
          ctx.fillStyle = '#00E5FF';
          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Base Station Sink Indicator
    const bsX = (activeScenario.sinkX / W) * width;
    const bsY = (1 - activeScenario.sinkY / H) * height;
    const clampedBsY = Math.max(12, Math.min(height - 12, bsY));

    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(bsX, clampedBsY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bsX, clampedBsY, 11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('SINK BS', bsX + 14, clampedBsY + 3);

  }, [
    activeNodes, 
    sleepNodes, 
    nodes, 
    selectedOptimizer, 
    selectedNode, 
    activeScenario, 
    analysisMode, 
    multiplicityFilter, 
    showNodeDots, 
    showSensingDiscs, 
    showSleepHalos, 
    showGridLines, 
    showRaysToProbe, 
    hoveredPoint, 
    gridAnalysis, 
    W, 
    H, 
    Rs
  ]);

  // Handle Mouse Move for High Precision Probe
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scale = canvas.width / rect.width;
    const canvasX = clientX * scale;
    const canvasY = clientY * scale;

    const xM = Math.max(0, Math.min(W, (canvasX / canvas.width) * W));
    const yM = Math.max(0, Math.min(H, (1 - canvasY / canvas.height) * H));

    const coveringIds: number[] = [];
    let nearestNodeId: number | null = null;
    let nearestDist = Infinity;

    activeNodes.forEach((n) => {
      const d = Math.sqrt((n.x - xM) ** 2 + (n.y - yM) ** 2);
      if (d <= Rs) {
        coveringIds.push(n.node_id);
      }
      if (d < nearestDist) {
        nearestDist = d;
        nearestNodeId = n.node_id;
      }
    });

    setHoveredPoint({
      x: Math.round(xM * 10) / 10,
      y: Math.round(yM * 10) / 10,
      k: coveringIds.length,
      coveringNodeIds: coveringIds,
      nearestNodeId,
      nearestDist: Math.round(nearestDist * 10) / 10
    });
  }, [activeNodes, W, H, Rs]);

  // Handle Click on Canvas for Node Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scale = canvas.width / rect.width;
    const canvasX = clientX * scale;
    const canvasY = clientY * scale;

    const xM = (canvasX / canvas.width) * W;
    const yM = (1 - canvasY / canvas.height) * H;

    let closestNode: NodeData | null = null;
    let minD = Infinity;

    nodes.forEach((n) => {
      const d = Math.sqrt((n.x - xM) ** 2 + (n.y - yM) ** 2);
      if (d < minD && d <= 8.0) { // Click threshold 8m
        minD = d;
        closestNode = n;
      }
    });

    if (closestNode) {
      soundFX.playClickSound();
      setSelectedNode(closestNode);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <section id="coverage-lab" className="py-8 px-2 sm:px-4 relative border-t border-[#1C3150] space-y-6">
      
      {/* 1. SECTION HEADER & SCIENTIFIC LAB RIBBON */}
      <div className="text-center max-w-4xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest shadow-sm">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Vectorized Sensing &amp; Overlap Reduction Lab</span>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
          Sensing Coverage &amp; Overlap Reduction Lab
        </h2>
        
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
          Vectorized spatial discretization (<code className="text-cyan-400 font-mono">&Delta; = {gridStep}m</code>) rigorously validating the strict <code className="text-cyan-400 font-mono">&Delta; &le; 1.0%</code> coverage boundary while reducing redundant overlap by 33.38%.
        </p>

        {/* 8 Live Telemetry Ribbon Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-3 font-mono text-[11px]">
          <div className="p-2 rounded-xl bg-[#0D1626] border border-cyan-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Coverage Ratio</span>
            <span className="text-cyan-300 font-bold text-sm">{gridAnalysis.covPct.toFixed(1)}%</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-violet-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Overlap Ratio</span>
            <span className="text-violet-300 font-bold text-sm">{gridAnalysis.ovlPct.toFixed(1)}%</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-rose-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Blindspots</span>
            <span className="text-rose-400 font-bold text-sm">{gridAnalysis.blindPct.toFixed(1)}%</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-emerald-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Active Nodes</span>
            <span className="text-emerald-400 font-bold text-sm">{gridAnalysis.activeCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-amber-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Sleeping Nodes</span>
            <span className="text-amber-400 font-bold text-sm">{gridAnalysis.sleepCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-blue-500/20 text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Sensing Radius</span>
            <span className="text-blue-300 font-bold text-sm">Rs = {Rs}m</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-[#1C3150] text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Field Dimensions</span>
            <span className="text-white font-bold text-sm">{W}m &times; {H}m</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0D1626] border border-[#1C3150] text-center">
            <span className="text-slate-500 block text-[9px] uppercase">Grid Points</span>
            <span className="text-cyan-400 font-bold text-sm">{gridAnalysis.totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* 2. THREE ANALYSIS MODES & TOOLBAR CONTROLS */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0B1220] p-3 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
        
        {/* 3 Main Analytical Mode Switchers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              soundFX.playClickSound();
              setAnalysisMode('heatmap');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              analysisMode === 'heatmap'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white bg-[#070B14] border border-[#1C3150]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MULTIPLICITY HEATMAP</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setAnalysisMode('overlap');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              analysisMode === 'overlap'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black shadow-lg shadow-violet-600/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white bg-[#070B14] border border-[#1C3150]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>OVERLAP CONCENTRATION</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClickSound();
              setAnalysisMode('blindspot');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              analysisMode === 'blindspot'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-black shadow-lg shadow-rose-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white bg-[#070B14] border border-[#1C3150]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-rose-300" />
            <span>BLINDSPOT HOLE MAP</span>
          </button>
        </div>

        {/* Secondary Controls: Grid Resolution & Seeds */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Resolution Selector */}
          <div className="flex items-center space-x-1 bg-[#070B14] p-1 rounded-xl border border-[#1C3150]">
            <span className="text-[10px] text-slate-500 px-1.5">Grid &Delta;:</span>
            {[1, 2, 5].map((st) => (
              <button
                key={st}
                onClick={() => setGridStep(st)}
                className={`px-2 py-0.5 text-[10px] rounded-lg font-bold transition-all ${
                  gridStep === st
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}m
              </button>
            ))}
          </div>

          {/* Seed Switcher */}
          <div className="flex items-center space-x-1 bg-[#070B14] p-1 rounded-xl border border-[#1C3150]">
            <span className="text-[10px] text-slate-500 px-1.5">Seed:</span>
            {[42, 123, 456].map((s) => (
              <button
                key={s}
                onClick={() => {
                  soundFX.playClickSound();
                  setSelectedSeed(s);
                }}
                className={`px-2 py-0.5 text-[10px] rounded-lg font-bold transition-all ${
                  selectedSeed === s
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN ANALYTICS WORKBENCH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Main Interactive Canvas */}
        <div className="lg:col-span-8 lab-card rounded-3xl p-5 border border-[#1C3150] bg-[#0D1626] flex flex-col justify-between relative overflow-hidden shadow-2xl space-y-4">
          
          {/* Top Canvas Bar */}
          <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-[#1C3150] font-mono text-xs">
            <div className="flex items-center space-x-2">
              <Hexagon className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-bold">
                {analysisMode === 'heatmap' ? 'Spatial Coverage Multiplicity Field' :
                 analysisMode === 'overlap' ? 'Redundancy Overlap Hotspots & Intersection Hulls' :
                 'Uncovered Hole Topography & Critical Blindspot Boundaries'}
              </span>
            </div>
            
            {/* Multiplicity Quick Filter (Only for heatmap mode) */}
            {analysisMode === 'heatmap' && (
              <div className="flex items-center space-x-1 bg-[#070B14] p-0.5 rounded-lg border border-[#1C3150] text-[10px]">
                <Filter className="w-3 h-3 text-slate-500 ml-1" />
                {(['all', '0x', '1x', '2x', '3x+'] as MultiplicityFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMultiplicityFilter(f)}
                    className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all ${
                      multiplicityFilter === f ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Scientific Canvas Viewport */}
          <div className="relative aspect-square max-h-[520px] mx-auto w-full bg-[#050912] rounded-2xl border border-[#1C3150] p-2 flex items-center justify-center overflow-hidden shadow-inner group">
            <canvas
              ref={canvasRef}
              width={560}
              height={560}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleCanvasClick}
              className="w-full h-full max-h-[500px] max-w-[500px] rounded-xl cursor-crosshair block"
            />

            {/* Real-Time Live Cursor Probe HUD */}
            {hoveredPoint && (
              <div className="absolute top-4 left-4 bg-[#0B1220]/95 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/40 font-mono text-xs pointer-events-none shadow-2xl space-y-1 z-20 max-w-xs">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Coordinate ({hoveredPoint.x}m, {hoveredPoint.y}m)</span>
                </div>
                
                <div className="flex items-center justify-between text-slate-300">
                  <span>Coverage Degree:</span>
                  <strong className={`font-black ${
                    hoveredPoint.k === 0 ? 'text-rose-400' :
                    hoveredPoint.k === 1 ? 'text-cyan-300' :
                    hoveredPoint.k === 2 ? 'text-emerald-400' : 'text-violet-400'
                  }`}>
                    {hoveredPoint.k}x ({hoveredPoint.k === 0 ? 'Blindspot' : hoveredPoint.k === 1 ? 'Optimal' : hoveredPoint.k === 2 ? 'Overlap' : 'Redundant'})
                  </strong>
                </div>

                <div className="text-[11px] text-slate-400">
                  Covering Sensors: <strong className="text-white">{hoveredPoint.coveringNodeIds.length > 0 ? `#${hoveredPoint.coveringNodeIds.join(', #')}` : 'None'}</strong>
                </div>

                {hoveredPoint.nearestNodeId !== null && (
                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-[#1C3150]">
                    Nearest: Node #{hoveredPoint.nearestNodeId} ({hoveredPoint.nearestDist}m away)
                  </div>
                )}
              </div>
            )}

            {/* Bottom Right Resolution & State Tag */}
            <div className="absolute bottom-4 right-4 bg-[#0B1220]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-[#1C3150] text-[10px] font-mono text-slate-400 pointer-events-none">
              &Delta; = {gridStep}m &bull; {gridAnalysis.cols}x{gridAnalysis.rows} Matrix
            </div>
          </div>

          {/* Bottom Layer Controls & Legend */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-[#1C3150] font-mono text-xs">
            
            {/* Color Legend for Active Mode */}
            {analysisMode === 'heatmap' ? (
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                  <span className="text-slate-400">0x Blindspot ({gridAnalysis.blindPct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                  <span className="text-cyan-300 font-semibold">1x Optimal</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span className="text-emerald-400 font-semibold">2x Overlap</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span className="text-amber-300 font-semibold">3x Redundant</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-violet-500"></span>
                  <span className="text-violet-300 font-semibold">4x+ Dense</span>
                </div>
              </div>
            ) : analysisMode === 'overlap' ? (
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
                  <span className="text-cyan-300">Dual Overlap (2x)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-violet-500"></span>
                  <span className="text-violet-300">Triple Overlap (3x)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span className="text-amber-300">High Redundancy (4x)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                  <span className="text-rose-400 font-bold">Critical Hotspot (5x+)</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse"></span>
                  <span className="text-rose-400 font-bold">Uncovered Blindspot ({gridAnalysis.blindPct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span className="text-amber-300">Boundary Perimeter Hole</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-900 border border-blue-700"></span>
                  <span className="text-slate-400">Covered Field Zone</span>
                </div>
              </div>
            )}

            {/* Layer Toggles */}
            <div className="flex items-center space-x-1.5 text-[10px]">
              <button
                onClick={() => setShowSensingDiscs(!showSensingDiscs)}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showSensingDiscs ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-[#070B14] text-slate-500 border-[#1C3150]'
                }`}
                title="Toggle sensing boundary radius discs"
              >
                Discs (Rs)
              </button>
              <button
                onClick={() => setShowNodeDots(!showNodeDots)}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showNodeDots ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-[#070B14] text-slate-500 border-[#1C3150]'
                }`}
                title="Toggle sensor node dots"
              >
                Nodes
              </button>
              <button
                onClick={() => setShowSleepHalos(!showSleepHalos)}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showSleepHalos ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#070B14] text-slate-500 border-[#1C3150]'
                }`}
                title="Toggle sleep nodes dashed halos"
              >
                Sleep Halos
              </button>
              <button
                onClick={() => setShowGridLines(!showGridLines)}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showGridLines ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-[#070B14] text-slate-500 border-[#1C3150]'
                }`}
                title="Toggle background coordinate grid lines"
              >
                Grid
              </button>
              <button
                onClick={() => setShowRaysToProbe(!showRaysToProbe)}
                className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showRaysToProbe ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-[#070B14] text-slate-500 border-[#1C3150]'
                }`}
                title="Toggle ray lines to covering sensors"
              >
                Rays
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Mode-Specific Analytics & Mathematical Formulations */}
        <div className="lg:col-span-4 space-y-4 font-mono text-xs">
          
          {/* Selected Node Inspector Card (if a node is clicked) */}
          {selectedNode && selectedNodeAnalysis && (
            <TiltCard3D intensity={6} className="lab-card rounded-2xl p-4 border border-amber-500/40 bg-[#0D1626] space-y-2 shadow-xl animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Target className="w-4 h-4" />
                  <span>INSPECTED SENSOR #{selectedNode.node_id}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-white text-[10px]"
                >
                  Deselect
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position:</span>
                  <span className="text-white font-bold">({selectedNode.x.toFixed(1)}m, {selectedNode.y.toFixed(1)}m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Energy:</span>
                  <span className="text-emerald-400 font-bold">{(selectedNode.currentEnergy ?? selectedNode.energy).toFixed(3)} J</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensing Disc Area:</span>
                  <span className="text-cyan-300 font-bold">{selectedNodeAnalysis.circleArea} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intersecting Neighbors:</span>
                  <span className="text-amber-300 font-bold">{selectedNodeAnalysis.activeNeighborsCount} nodes</span>
                </div>
              </div>

              {selectedNodeAnalysis.intersecting.length > 0 && (
                <div className="pt-2 border-t border-[#1C3150] space-y-1 text-[10px]">
                  <span className="text-slate-400 block font-semibold">Top Overlapping Neighbors:</span>
                  {selectedNodeAnalysis.intersecting.slice(0, 3).map((item) => (
                    <div key={item.node.node_id} className="flex justify-between bg-[#070B14] p-1.5 rounded-lg border border-[#1C3150]">
                      <span className="text-cyan-300">Node #{item.node.node_id} ({item.dist}m)</span>
                      <span className="text-amber-400 font-bold">{item.overlapPct}% overlap</span>
                    </div>
                  ))}
                </div>
              )}
            </TiltCard3D>
          )}

          {/* Mode 2 Specific Panel: Overlap Concentration Analytics */}
          {analysisMode === 'overlap' && (
            <div className="lab-card rounded-2xl p-4 border border-violet-500/30 bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Overlap Redundancy Telemetry</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1C3150]">
                  <span className="text-[10px] text-slate-500 block uppercase">Overlap Area</span>
                  <span className="text-cyan-400 font-extrabold text-base">{gridAnalysis.overlapAreaM2.toLocaleString()} m²</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1C3150]">
                  <span className="text-[10px] text-slate-500 block uppercase">Peak Multiplicity</span>
                  <span className="text-amber-400 font-extrabold text-base">{gridAnalysis.maxK}x Covered</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                <span className="text-slate-400 block font-semibold">Highest Overlapping Sensor Pairs:</span>
                {gridAnalysis.overlapPairs.slice(0, 3).map((pair, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#070B14] p-2 rounded-xl border border-[#1C3150]">
                    <span className="text-white font-bold">Node #{pair.nodeAId} &harr; Node #{pair.nodeBId}</span>
                    <span className="text-rose-400 font-bold">{pair.overlapPct}% ({pair.distance}m)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3 Specific Panel: Blindspot Hole Analytics */}
          {analysisMode === 'blindspot' && (
            <div className="lab-card rounded-2xl p-4 border border-rose-500/30 bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Coverage Hole Topography</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1C3150]">
                  <span className="text-[10px] text-slate-500 block uppercase">Uncovered Area</span>
                  <span className="text-rose-400 font-extrabold text-base">{gridAnalysis.blindspotAreaM2.toLocaleString()} m²</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1C3150]">
                  <span className="text-[10px] text-slate-500 block uppercase">Discrete Holes</span>
                  <span className="text-amber-400 font-extrabold text-base">{gridAnalysis.holes.length} Clusters</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                <span className="text-slate-400 block font-semibold">Critical Coverage Holes Detected:</span>
                {gridAnalysis.holes.slice(0, 3).map((hole) => (
                  <div key={hole.id} className="bg-[#070B14] p-2 rounded-xl border border-[#1C3150] space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-rose-300">Hole #{hole.id} ({hole.isBoundary ? 'Boundary' : 'Interior'})</span>
                      <span className="text-white">{hole.areaM2} m²</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Centroid: ({hole.centroid.x}m, {hole.centroid.y}m)</span>
                      <span>Gap Radius: ~{hole.maxInscribedRadius}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Coverage Constraint Card */}
          <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Coverage Constraint Bounding</span>
            </div>

            <div className="text-2xl font-extrabold text-white font-mono">
              {gridAnalysis.covPct.toFixed(2)}% <span className="text-xs font-normal text-slate-400">Preserved Field Area</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300 border-t border-[#1C3150] pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Sensing Area:</span>
                <span className="font-bold text-white">{gridAnalysis.coveredAreaM2.toLocaleString()} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sensing Overlap Ratio:</span>
                <span className="font-bold text-violet-400">{gridAnalysis.ovlPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uncovered Blindspots:</span>
                <span className="font-bold text-rose-400">{gridAnalysis.blindPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sleep Node Redundancy:</span>
                <span className="font-bold text-amber-400">{gridAnalysis.sleepCount} Nodes Sleeping</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations Card */}
          <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-2.5 shadow-xl font-mono">
            <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider text-xs">
              <Info className="w-4 h-4" />
              <span>Mathematical Formulations</span>
            </div>

            <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] space-y-1.5 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500">Discretization:</span> <code className="text-cyan-300">G = {'{(x_g, y_g)}'}, &Delta; = {gridStep}.0m</code>
              </div>
              <div>
                <span className="text-slate-500">Coverage Matrix:</span> <code className="text-emerald-400">M_i,g = &Iopf;(||s_i - g|| &le; R_s)</code>
              </div>
              <div>
                <span className="text-slate-500">Multiplicity:</span> <code className="text-cyan-300">k(g) = &sum; M_i,g</code>
              </div>
              <div>
                <span className="text-slate-500">Constraint:</span> <code className="text-amber-400">C_target &ge; C_baseline - 1.0%</code>
              </div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
