# Diagnostic Findings (NeuroSense-WSN v2.2)

1. **Disconnected Control Flow**: The main sidebar button `#btn-start-routing` operated independently from `player.js` instead of driving the unified Play/Pause/Resume state machine, leaving the player in `IDLE` state with 0 loaded frames until the full 3000-round calculation finished.
2. **Invisible Links & Missing Arrowheads**: WebGL clamps `THREE.Line` linewidth to 1px; without 3D cylinder/tube meshes, arrowheads, and high `renderOrder`, 1px line segments were occluded beneath sensing disks.
3. **Viewport Cropping & Occlusion**: The camera position $(50, 140, 185)$ cropped the Base Station $(50, 150)$ near the top canvas boundary while the floating bottom toolbar (`.viewport-controls-bar`) occluded sensor nodes positioned along $y \in [0, 15\text{m}]$.
4. **Missing Terrain & RF Impairment Renderers**: Selected obstacles (Central Lake hazard, facility walls) and RF jammers were not rendered as Three.js spatial meshes in `field3d.js`.
5. **Excessive Disk Opacity Compounding**: Sensing disks lacked `depthWrite: false` and compounded alpha opacity in dense clusters (multiplicity $\ge 3\times$), obscuring node spheres and darkening active cyan colors.
