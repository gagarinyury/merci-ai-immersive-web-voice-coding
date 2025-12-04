/**
 * Тестовый скрипт для проверки Meshy AI интеграции
 *
 * Использование: npx tsx backend/test-meshy.ts
 */

import { generateModel, ANIMATIONS } from './src/tools/meshyTool.js';
import { logger } from './src/utils/logger.js';

async function testMeshy() {
  logger.info('🚀 Testing Meshy AI integration...');

  try {
    // Тест 1: Простой объект (не гуманоид)
    logger.info('\n📦 Test 1: Simple object (tree)');
    const tree = await generateModel('simple tree', {
      onProgress: (progress, elapsed, status) => {
        logger.info({ progress, elapsed, status }, 'Generation progress');
      }
    });

    logger.info({ result: tree }, '✅ Tree generated successfully');
    logger.info(`   File: ${tree.servePath}`);
    logger.info(`   Size: ${tree.sizeKB} KB`);
    logger.info(`   Is humanoid: ${tree.isHumanoid}`);

    // Тест 2: Гуманоид с риггингом и анимацией (закомментировано - дорого!)
    // logger.info('\n🧟 Test 2: Humanoid with animation (zombie)');
    // const zombie = await generateModel('zombie enemy', {
    //   withRigging: true,
    //   withAnimation: true,
    //   animationId: ANIMATIONS.CASUAL_WALK,
    //   onProgress: (progress, elapsed, status) => {
    //     logger.info({ progress, elapsed, status }, 'Generation progress');
    //   }
    // });

    // logger.info({ result: zombie }, '✅ Zombie generated successfully');
    // logger.info(`   File: ${zombie.servePath}`);
    // logger.info(`   Rigged: ${zombie.rigged}`);
    // logger.info(`   Animated: ${zombie.animated}`);

    logger.info('\n✅ All tests passed!');
    process.exit(0);

  } catch (error: any) {
    logger.error({ err: error }, '❌ Test failed');
    process.exit(1);
  }
}

testMeshy();
