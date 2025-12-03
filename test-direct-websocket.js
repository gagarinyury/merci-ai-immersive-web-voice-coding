import WebSocket from 'ws';

console.log('🔌 Connecting to WebSocket server...');
const ws = new WebSocket('ws://localhost:3002');

ws.on('open', function open() {
  console.log('✅ Connected to ws://localhost:3002');

  // Отправляем жёлтую сферу
  const message = {
    action: 'execute',
    code: `
const world = window.__IWSDK_WORLD__;
const sphere = world.createTransformEntity('direct-yellow-sphere');
sphere.setPosition({ x: 1, y: 1.5, z: -2 });
sphere.addComponent('Mesh', {
  geometry: { type: 'sphere', radius: 0.3 },
  material: { type: 'standard', color: 0xffff00 }
});
sphere.addComponent('Interactable', {
  hoverEnabled: true,
  selectEnabled: true
});
sphere.addComponent('DistanceGrabbable', {
  maxDistance: 10,
  showRay: true
});
console.log('🟡 Yellow sphere created directly via WebSocket!');
    `.trim(),
    timestamp: Date.now()
  };

  console.log('📤 Sending code to browser...');
  ws.send(JSON.stringify(message));
  console.log('✅ Code sent!');

  setTimeout(() => {
    ws.close();
    console.log('👋 Connection closed');
    process.exit(0);
  }, 1000);
});

ws.on('message', function message(data) {
  console.log('📥 Received from server:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('🔴 Connection closed');
});
