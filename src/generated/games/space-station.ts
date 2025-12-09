/**
 * 🚀 SPACE STATION
 * A compact space station floating in your room!
 */

console.log("🚀 Space Station!");

// === STATION CORE (central hub) ===
const core = createCylinder([0, 1.3, -1.5], 0x8899aa, 0.25, 0.4);
addPhysics(core, { kinematic: true });

// Core windows (glowing)
const coreWindow1 = createBox([0.26, 1.3, -1.5], 0x00ffff, [0.02, 0.1, 0.1]);
addPhysics(coreWindow1, { kinematic: true });
const coreWindow2 = createBox([-0.26, 1.3, -1.5], 0x00ffff, [0.02, 0.1, 0.1]);
addPhysics(coreWindow2, { kinematic: true });
const coreWindow3 = createBox([0, 1.3, -1.24], 0x00ffff, [0.1, 0.1, 0.02]);
addPhysics(coreWindow3, { kinematic: true });

// === HABITAT RINGS ===
const ring1 = createTorus([0, 1.3, -1.5], 0x667788, 0.5, 0.03);
addPhysics(ring1, { kinematic: true });
const ring2 = createTorus([0, 1.3, -1.5], 0x556677, 0.6, 0.02);
ring2.rotation.x = Math.PI / 2;
addPhysics(ring2, { kinematic: true });

// === SOLAR PANELS (4 arms) ===
const panelColor = 0x2244aa;
const armColor = 0x444444;

// Panel 1 - Right
const arm1 = createBox([0.5, 1.3, -1.5], armColor, [0.3, 0.02, 0.02]);
addPhysics(arm1, { kinematic: true });
const panel1 = createBox([0.85, 1.3, -1.5], panelColor, [0.2, 0.01, 0.15]);
addPhysics(panel1, { kinematic: true });

// Panel 2 - Left
const arm2 = createBox([-0.5, 1.3, -1.5], armColor, [0.3, 0.02, 0.02]);
addPhysics(arm2, { kinematic: true });
const panel2 = createBox([-0.85, 1.3, -1.5], panelColor, [0.2, 0.01, 0.15]);
addPhysics(panel2, { kinematic: true });

// Panel 3 - Front
const arm3 = createBox([0, 1.3, -1.0], armColor, [0.02, 0.02, 0.3]);
addPhysics(arm3, { kinematic: true });
const panel3 = createBox([0, 1.3, -0.65], panelColor, [0.15, 0.01, 0.2]);
addPhysics(panel3, { kinematic: true });

// Panel 4 - Back
const arm4 = createBox([0, 1.3, -2.0], armColor, [0.02, 0.02, 0.3]);
addPhysics(arm4, { kinematic: true });
const panel4 = createBox([0, 1.3, -2.35], panelColor, [0.15, 0.01, 0.2]);
addPhysics(panel4, { kinematic: true });

// === DOCKING MODULES ===
// Top module
const dockTop = createCylinder([0, 1.65, -1.5], 0x99aacc, 0.08, 0.2);
addPhysics(dockTop, { kinematic: true });
const dockTopLight = createSphere([0, 1.78, -1.5], 0x00ff00, 0.03);
addPhysics(dockTopLight, { kinematic: true });

// Bottom module
const dockBottom = createCylinder([0, 0.95, -1.5], 0x99aacc, 0.08, 0.2);
addPhysics(dockBottom, { kinematic: true });
const dockBottomLight = createSphere([0, 0.82, -1.5], 0xff0000, 0.03);
addPhysics(dockBottomLight, { kinematic: true });

// === ANTENNA ARRAY ===
const antenna1 = createCylinder([0.15, 1.85, -1.5], 0xcccccc, 0.01, 0.15);
addPhysics(antenna1, { kinematic: true });
const antenna2 = createCylinder([-0.15, 1.85, -1.5], 0xcccccc, 0.01, 0.15);
addPhysics(antenna2, { kinematic: true });
const antennaDish = createSphere([0, 1.95, -1.5], 0xdddddd, 0.05);
addPhysics(antennaDish, { kinematic: true });

// === CARGO PODS ===
const cargo1 = createBox([0.3, 1.0, -1.3], 0xaa6633, [0.08, 0.08, 0.08]);
addPhysics(cargo1, { grabbable: true });
const cargo2 = createBox([-0.3, 1.0, -1.7], 0x33aa66, [0.08, 0.08, 0.08]);
addPhysics(cargo2, { grabbable: true });
const cargo3 = createBox([0.25, 1.55, -1.7], 0x6633aa, [0.06, 0.06, 0.06]);
addPhysics(cargo3, { grabbable: true });

// === FLOATING DEBRIS (interactive) ===
const debris1 = createBox([0.6, 1.5, -1.2], 0x888888, 0.04);
addPhysics(debris1, { grabbable: true, noGravity: true, damping: 2 });
const debris2 = createSphere([-0.5, 1.1, -1.8], 0x666666, 0.03);
addPhysics(debris2, { grabbable: true, noGravity: true, damping: 2 });

// Animation time
let time = 0;

// Store references for rotation
const stationParts = [
  core, coreWindow1, coreWindow2, coreWindow3,
  ring1, ring2,
  arm1, panel1, arm2, panel2, arm3, panel3, arm4, panel4,
  dockTop, dockTopLight, dockBottom, dockBottomLight,
  antenna1, antenna2, antennaDish
];

// Initial positions for rotation around center
const centerY = 1.3;
const centerZ = -1.5;

const updateGame = (dt: number) => {
  time += dt;

  // Slow station rotation
  const rotSpeed = 0.1;

  // Rotate rings
  ring1.rotation.z = time * rotSpeed * 2;
  ring2.rotation.y = time * rotSpeed;

  // Pulsing lights
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  (dockTopLight.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ff00);
  (dockTopLight.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

  const pulse2 = Math.sin(time * 2 + 1) * 0.5 + 0.5;
  (dockBottomLight.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
  (dockBottomLight.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse2;

  // Window glow
  const windowPulse = Math.sin(time * 1.5) * 0.3 + 0.7;
  [coreWindow1, coreWindow2, coreWindow3].forEach(w => {
    (w.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ffff);
    (w.material as THREE.MeshStandardMaterial).emissiveIntensity = windowPulse;
  });

  // Solar panel shimmer
  const panelShimmer = Math.sin(time * 2) * 0.2 + 0.3;
  [panel1, panel2, panel3, panel4].forEach(p => {
    (p.material as THREE.MeshStandardMaterial).emissive.setHex(0x2244aa);
    (p.material as THREE.MeshStandardMaterial).emissiveIntensity = panelShimmer;
  });

  // Floating debris gentle drift
  debris1.position.y = 1.5 + Math.sin(time * 0.5) * 0.05;
  debris1.rotation.x = time * 0.3;
  debris1.rotation.y = time * 0.2;

  debris2.position.y = 1.1 + Math.cos(time * 0.4) * 0.04;
  debris2.rotation.z = time * 0.25;
};
