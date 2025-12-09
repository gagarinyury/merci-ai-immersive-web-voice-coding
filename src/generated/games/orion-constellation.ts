/**
 * ⭐ ORION CONSTELLATION
 * Real star positions - grabbable and rotatable!
 */

console.log("⭐ Orion Constellation!");

// Create constellation group
const orion = new THREE.Group();
orion.position.set(0, 1.4, -1.5);

// Real Orion star data: [x, y, brightness, name]
// Scaled to fit in ~1m space
const stars: [number, number, number, string][] = [
  // The Hunter's body
  [0, 0.45, 1.0, "Betelgeuse"],      // Red supergiant (top left shoulder)
  [0.35, 0.42, 0.8, "Bellatrix"],    // Top right shoulder
  [0.05, 0, 0.6, "Alnitak"],         // Belt left
  [0.15, 0.02, 0.7, "Alnilam"],      // Belt center
  [0.25, 0.04, 0.6, "Mintaka"],      // Belt right
  [-0.05, -0.35, 0.9, "Saiph"],      // Bottom left foot
  [0.4, -0.38, 1.0, "Rigel"],        // Blue supergiant (bottom right foot)

  // Additional stars
  [0.15, 0.55, 0.4, "Meissa"],       // Head
  [-0.15, 0.25, 0.3, "Arm1"],        // Left arm
  [-0.25, 0.15, 0.3, "Arm2"],        // Left arm extended
  [0.5, 0.25, 0.3, "Shield1"],       // Shield
  [0.55, 0.15, 0.3, "Shield2"],      // Shield
  [0.6, 0.05, 0.3, "Shield3"],       // Shield
];

// Star colors based on real stellar classification
const getStarColor = (name: string): number => {
  if (name === "Betelgeuse") return 0xff6644; // Red supergiant
  if (name === "Rigel") return 0xaaccff;      // Blue supergiant
  if (name === "Bellatrix") return 0xccddff;  // Blue-white
  return 0xffffee; // White/yellow for others
};

// Create stars
const starMeshes: THREE.Mesh[] = [];
stars.forEach(([x, y, brightness, name]) => {
  const size = 0.02 + brightness * 0.025;
  const geo = new THREE.SphereGeometry(size, 16, 16);
  const color = getStarColor(name);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9
  });
  const star = new THREE.Mesh(geo, mat);
  star.position.set(x, y, 0);
  star.userData.brightness = brightness;
  star.userData.baseSize = size;
  orion.add(star);
  starMeshes.push(star);
  geometries.push(geo);
  materials.push(mat);

  // Glow effect
  const glowGeo = new THREE.SphereGeometry(size * 2.5, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.15
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  star.add(glow);
  geometries.push(glowGeo);
  materials.push(glowMat);
});

// Draw constellation lines
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x4488ff,
  transparent: true,
  opacity: 0.4
});
materials.push(lineMaterial);

// Connection pairs (indices into stars array)
const connections = [
  [0, 1],   // Shoulders
  [0, 2],   // Left shoulder to belt
  [1, 4],   // Right shoulder to belt
  [2, 3], [3, 4], // Belt
  [2, 5],   // Belt to left foot
  [4, 6],   // Belt to right foot
  [0, 7], [1, 7], // Head
  [0, 8], [8, 9], // Left arm
  [1, 10], [10, 11], [11, 12], // Shield
];

connections.forEach(([i, j]) => {
  const points = [
    new THREE.Vector3(stars[i][0], stars[i][1], 0),
    new THREE.Vector3(stars[j][0], stars[j][1], 0)
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, lineMaterial);
  orion.add(line);
});

// Add to scene
world.scene.add(orion);
meshes.push(orion as any);

// Invisible grab box for physics
const grabBox = createBox([0, 1.4, -1.5], 0x000000, [0.9, 1.1, 0.2]);
(grabBox.material as THREE.MeshStandardMaterial).transparent = true;
(grabBox.material as THREE.MeshStandardMaterial).opacity = 0.05;
const grabEntity = addPhysics(grabBox, {
  grabbable: true,
  scalable: false,  // NO scaling - only rotation!
  kinematic: true,
  noGravity: true
});

// Background stars (distant)
for (let i = 0; i < 80; i++) {
  const geo = new THREE.SphereGeometry(0.005 + Math.random() * 0.008, 4, 4);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3 + Math.random() * 0.4
  });
  const bgStar = new THREE.Mesh(geo, mat);
  const angle = Math.random() * Math.PI * 2;
  const radius = 1 + Math.random() * 1.5;
  const height = (Math.random() - 0.5) * 2;
  bgStar.position.set(
    Math.cos(angle) * radius,
    1.4 + height,
    -1.5 + Math.sin(angle) * 0.5 - 0.5
  );
  world.scene.add(bgStar);
  meshes.push(bgStar);
  geometries.push(geo);
  materials.push(mat);
}

let time = 0;
let isGrabbed = false;

// Game loop
const updateGame = (dt: number) => {
  time += dt;

  // Check if grabbed
  const entity = getEntity(grabBox);
  isGrabbed = entity?.isGrabbed?.() || false;

  // Sync orion group to grab box (rotation only!)
  orion.position.copy(grabBox.position);
  orion.rotation.copy(grabBox.rotation);

  // Star twinkling
  starMeshes.forEach((star, i) => {
    const twinkle = 0.8 + 0.2 * Math.sin(time * 3 + i * 1.5);
    const mat = star.material as THREE.MeshBasicMaterial;
    mat.opacity = twinkle * star.userData.brightness;

    // Subtle size pulse
    const scale = 1 + 0.1 * Math.sin(time * 2 + i);
    star.scale.setScalar(scale);
  });

  // Slow auto-rotate when not grabbed
  if (!isGrabbed) {
    grabBox.rotation.y += dt * 0.15;
  }

  // Glow pulse on lines
  lineMaterial.opacity = 0.3 + 0.15 * Math.sin(time * 1.5);
};
