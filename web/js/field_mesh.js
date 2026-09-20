/**
 * Three.js Geometry and Mesh Generators for WSN Topology Field.
 * Provides optimized meshes for base station, obstacles, jammers, links, arrowheads, and sensing disks.
 */

export const MESH_COLORS = {
  ACTIVE: 0x06B6D4, SLEEP: 0x64748B, CH: 0xF59E0B, LEADER: 0xFFFFFF,
  DEAD: 0xEF4444, SINK: 0x10B981, SINK_FLASH: 0x34D399,
  MEMBER: 0x06B6D4, CHAIN: 0xF59E0B, SINK_RELAY: 0x10B981, RELAY: 0x8B5CF6
};

export function createBaseStationGroup(x, y) {
  const group = new THREE.Group();
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 3.2, 24, 8),
    new THREE.MeshStandardMaterial({ color: MESH_COLORS.SINK, metalness: 0.8, roughness: 0.2, emissive: 0x10B981, emissiveIntensity: 0.35 })
  );
  mast.position.y = 12;
  group.add(mast);

  const dome = new THREE.Mesh(new THREE.OctahedronGeometry(4.5, 0), new THREE.MeshBasicMaterial({ color: 0x34D399 }));
  dome.position.y = 24;
  group.add(dome);

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(6.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: MESH_COLORS.SINK_FLASH, transparent: true, opacity: 0.0 })
  );
  flash.position.y = 24;
  group.add(flash);

  const label = createTextSprite("BS (50, 150)", "#34D399");
  label.position.set(0, 32, 0);
  label.scale.set(20, 5, 1);
  group.add(label);

  group.position.set(x, 0, y);
  return { group, flashMesh: flash };
}

export function createTextSprite(text, colorStr = "#FFFFFF") {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colorStr;
  ctx.font = "bold 26px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(16, 4, 1);
  return sprite;
}

export function createThickLinkMesh(src, dst, color, radius = 0.3) {
  const dir = new THREE.Vector3().subVectors(dst, src);
  const len = dir.length();
  const geom = new THREE.CylinderGeometry(radius, radius, len, 6);
  geom.translate(0, len / 2, 0);
  geom.rotateX(Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, depthTest: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(src);
  mesh.lookAt(dst);
  mesh.renderOrder = 20;
  return mesh;
}

export function createArrowHeadMesh(src, dst, color) {
  const dir = new THREE.Vector3().subVectors(dst, src);
  const arrowPos = new THREE.Vector3().addVectors(src, dir.clone().multiplyScalar(0.85));

  const geom = new THREE.ConeGeometry(1.4, 3.6, 8);
  geom.rotateX(Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: color, depthTest: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(arrowPos);
  mesh.lookAt(dst);
  mesh.renderOrder = 22;
  return mesh;
}

export function createDeadCrossMesh(x, y) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x - 1.4, 2.2, y - 1.4), new THREE.Vector3(x + 1.4, 2.2, y + 1.4),
    new THREE.Vector3(x - 1.4, 2.2, y + 1.4), new THREE.Vector3(x + 1.4, 2.2, y - 1.4)
  ]);
  const mat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2, depthTest: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 25;
  return lines;
}

export function createSensingDiskGroup(x, y, radius) {
  const group = new THREE.Group();
  const innerGeo = new THREE.CircleGeometry(radius, 32).rotateX(-Math.PI / 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: MESH_COLORS.ACTIVE, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.set(x, 0.06, y);
  inner.renderOrder = 1;
  group.add(inner);

  const rimGeo = new THREE.RingGeometry(radius - 0.3, radius, 32).rotateX(-Math.PI / 2);
  const rimMat = new THREE.MeshBasicMaterial({
    color: MESH_COLORS.ACTIVE, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(x, 0.08, y);
  rim.renderOrder = 2;
  group.add(rim);

  return group;
}

export function createObstacleMeshes(preset) {
  const group = new THREE.Group();
  if (preset === "central-lake") {
    const lake = new THREE.Mesh(
      new THREE.BoxGeometry(22, 1.0, 22),
      new THREE.MeshStandardMaterial({ color: 0x0284C7, transparent: true, opacity: 0.7, roughness: 0.1, emissive: 0x0284C7, emissiveIntensity: 0.25 })
    );
    lake.position.set(50, 0.5, 50);
    group.add(lake);
  } else if (preset === "dual-walls") {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 30), new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5 }));
    w1.position.set(30, 3, 50);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 30), new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5 }));
    w2.position.set(70, 3, 50);
    group.add(w1); group.add(w2);
  }
  return group;
}

export function createJammerMeshes(preset) {
  const group = new THREE.Group();
  const addOne = (x, y, radius) => {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.8, 14, 6), new THREE.MeshStandardMaterial({ color: 0xF43F5E, emissive: 0xF43F5E, emissiveIntensity: 0.4 }));
    mast.position.set(x, 7, y);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.8, radius, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xF43F5E, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    ring.position.set(x, 0.2, y);
    group.add(mast); group.add(ring);
  };
  if (preset === "central-jammer") addOne(50, 50, 22);
  else if (preset === "dual-jammers") { addOne(30, 50, 16); addOne(70, 50, 16); }
  return group;
}
