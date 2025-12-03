import { World } from '@infrared/sdk';

// Создаем синий куб в центре сцены
const cube = world.createTransformEntity('blue-cube');

// Позиционируем куб перед пользователем
cube.setPosition({ x: 0, y: 1.5, z: -2 });

// Добавляем геометрию куба с синим материалом
cube.addComponent('Mesh', {
  geometry: { 
    type: 'box', 
    width: 0.5, 
    height: 0.5, 
    depth: 0.5 
  },
  material: { 
    type: 'standard', 
    color: 0x0066ff // Синий цвет
  }
});

// Добавляем возможность взаимодействия
cube.addComponent('Interactable', {
  hoverEnabled: true,
  selectEnabled: true
});

// Добавляем возможность хватать куб
cube.addComponent('DistanceGrabbable', {
  maxDistance: 10,
  showRay: true
});

console.log('Синий куб создан в центре сцены!');
