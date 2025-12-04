import { AssetManifest, World } from "~/World";
import { DistanceGrabbable, Interactable } from "~/components";

// Asset manifest for the zombie model
const manifest: AssetManifest = {
  gltf: {
    zombieModel: '/models/019ae650-8193-7d3b-997a-f8b9f7e50f26.glb'
  }
};

// Create and initialize the world
const world = await World.init({
  renderer: {
    clearColor: 0x1a1a2e, // Dark blue-ish background for spooky atmosphere
  },
  sessionMode: 'immersive-vr', // VR mode
  assetManifest: manifest,
});

// Add lighting for better visibility
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft ambient light
world.scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
world.scene.add(directionalLight);

// Add a green-tinted light for spooky effect
const spookyLight = new THREE.PointLight(0x00ff00, 0.8, 10);
spookyLight.position.set(-2, 2, -3);
world.scene.add(spookyLight);

// Load and create the zombie entity
const zombieGltf = world.assetManager.gltf.zombieModel;
const zombieEntity = world.createGltfEntity(zombieGltf);

// Position the zombie in front of the user
zombieEntity.object3D.position.set(0, 0, -2);
zombieEntity.object3D.scale.setScalar(1.0); // Adjust scale if needed

// Make the zombie interactive and grabbable
zombieEntity.addComponent(Interactable);
zombieEntity.addComponent(DistanceGrabbable, {
  maxDistance: 10, // Can grab from up to 10 meters away
});

// Create a simple floor for reference
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x2a2a3a,
  roughness: 0.8,
  metalness: 0.2
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
floorMesh.position.y = -1; // Position below origin
floorMesh.receiveShadow = true;

const floorEntity = world.createTransformEntity(floorMesh);

console.log('Zombie character loaded and ready!');
console.log('You can interact with and grab the zombie in VR mode.');
