/**
 * 🔮 CRYSTAL CUBE
 * Transparent cube with inner geometry - grabbable & scalable
 */

console.log("🔮 Crystal Cube!");

// === OUTER TRANSPARENT CUBE ===
const outerGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const outerMat = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.3,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.9,
  thickness: 0.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  side: THREE.DoubleSide,
});
const outerCube = new THREE.Mesh(outerGeo, outerMat);
outerCube.position.set(0, 1.2, -1.2);
world.scene.add(outerCube);
meshes.push(outerCube);
geometries.push(outerGeo);
materials.push(outerMat);

// === INNER GLOWING CORE ===
const coreGeo = new THREE.IcosahedronGeometry(0.12, 0);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0xff6600,
  emissive: 0xff4400,
  emissiveIntensity: 2,
});
const core = new THREE.Mesh(coreGeo, coreMat);
outerCube.add(core);
geometries.push(coreGeo);
materials.push(coreMat);

// === ORBITING MINI SPHERES ===
const orbitSpheres: THREE.Mesh[] = [];
const colors = [0xff0066, 0x00ff88, 0x4488ff, 0xffff00];

for (let i = 0; i < 4; i++) {
  const sphereGeo = new THREE.SphereGeometry(0.03, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: colors[i],
    emissive: colors[i],
    emissiveIntensity: 1.5,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  outerCube.add(sphere);
  orbitSpheres.push(sphere);
  geometries.push(sphereGeo);
  materials.push(sphereMat);
}

// === WIREFRAME INNER CUBE ===
const wireGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  wireframe: true,
});
const wireCube = new THREE.Mesh(wireGeo, wireMat);
outerCube.add(wireCube);
geometries.push(wireGeo);
materials.push(wireMat);

// === PHYSICS ===
addPhysics(outerCube, {
  grabbable: true,
  scalable: true,
  dynamic: true,
  bouncy: true,
});

// === ANIMATION ===
let time = 0;

const updateGame = (dt: number) => {
  time += dt;

  // Rotate inner elements
  core.rotation.x += dt * 0.5;
  core.rotation.y += dt * 0.7;

  wireCube.rotation.x -= dt * 0.3;
  wireCube.rotation.z += dt * 0.4;

  // Orbit spheres
  for (let i = 0; i < orbitSpheres.length; i++) {
    const angle = time * 1.5 + (i * Math.PI * 0.5);
    const radius = 0.15;
    orbitSpheres[i].position.x = Math.cos(angle) * radius;
    orbitSpheres[i].position.y = Math.sin(angle * 0.7) * radius * 0.5;
    orbitSpheres[i].position.z = Math.sin(angle) * radius;
  }

  // Pulse core glow
  const pulse = 1.5 + Math.sin(time * 3) * 0.5;
  coreMat.emissiveIntensity = pulse;
};
