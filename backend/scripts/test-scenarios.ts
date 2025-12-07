/**
 * Test Scenarios for SSE Events
 *
 * Различные сценарии для тестирования Canvas панели
 */

export interface TestMessage {
  type: 'user' | 'assistant' | 'tool_start' | 'tool_complete' | 'tool_failed' | 'thinking';
  text?: string;
  toolName?: string;
  error?: string;
  delay?: number;
}

/**
 * Базовый сценарий - создание и изменение объекта
 */
export const basicScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Create a red cube',
    delay: 1000
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Creating a red cube using THREE.js BoxGeometry...',
    delay: 1000
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1500
  },
  {
    type: 'assistant',
    text: 'Created a red cube at position (0, 1.5, -2)',
    delay: 500
  },
  {
    type: 'user',
    text: 'Make it blue',
    delay: 2000
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Editing the material color to blue...',
    delay: 800
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 1200
  },
  {
    type: 'assistant',
    text: 'Changed the cube color to blue',
    delay: 500
  }
];

/**
 * Реалистичный диалог с агентом - создание игры
 */
export const gameCreationScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Создай простую игру - красный куб который нужно поймать',
    delay: 1000
  },
  {
    type: 'thinking',
    text: 'Планирую создать игру с интерактивным кубом...',
    delay: 800
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Создаю красный куб с компонентами Interactable и DistanceGrabbable...',
    delay: 1500
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 2000
  },
  {
    type: 'assistant',
    text: 'Создал красный куб! Теперь можешь схватить его рукой в VR.',
    delay: 1000
  },
  {
    type: 'user',
    text: 'Отлично! Теперь добавь счётчик пойманных кубов',
    delay: 3000
  },
  {
    type: 'thinking',
    text: 'Нужно добавить систему подсчёта и UI панель со счётчиком...',
    delay: 1000
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Добавляю обработчик события grab и счётчик...',
    delay: 1800
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 1500
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 300
  },
  {
    type: 'thinking',
    text: 'Создаю Canvas UI для отображения счёта...',
    delay: 1200
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1800
  },
  {
    type: 'assistant',
    text: 'Готово! Теперь когда ты ловишь куб, счётчик увеличивается. Текущий счёт: 0',
    delay: 800
  }
];

/**
 * Сценарий с ошибкой и исправлением
 */
export const errorRecoveryScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Создай сферу которая летает',
    delay: 1000
  },
  {
    type: 'thinking',
    text: 'Создаю летающую сферу с анимацией...',
    delay: 800
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Добавляю код анимации движения...',
    delay: 1500
  },
  {
    type: 'tool_failed',
    toolName: 'Write',
    error: 'Syntax error: missing semicolon at line 15',
    delay: 1200
  },
  {
    type: 'thinking',
    text: 'Обнаружена ошибка синтаксиса, исправляю...',
    delay: 1000
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Исправляю синтаксическую ошибку...',
    delay: 1000
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 1500
  },
  {
    type: 'assistant',
    text: 'Исправил ошибку! Теперь сфера плавно летает по синусоиде.',
    delay: 800
  }
];

/**
 * Множественные tool calls - сложная задача
 */
export const complexTaskScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Создай солнечную систему с вращающимися планетами',
    delay: 1000
  },
  {
    type: 'thinking',
    text: 'Это сложная задача. Нужно создать солнце и несколько планет с орбитами...',
    delay: 1200
  },

  // Создание солнца
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 800
  },
  {
    type: 'thinking',
    text: 'Создаю центральное солнце (жёлтая сфера с эмиссией)...',
    delay: 1500
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 2000
  },

  // Создание Земли
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Добавляю Землю с орбитальным вращением...',
    delay: 1500
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1800
  },

  // Создание Марса
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Добавляю Марс (красная планета) на другой орбите...',
    delay: 1500
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1800
  },

  // Создание системы управления
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Создаю систему управления вращением планет...',
    delay: 1200
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1500
  },

  {
    type: 'assistant',
    text: 'Готово! Создал солнечную систему: Солнце в центре, Земля и Марс вращаются по орбитам. Можешь остановить/запустить вращение голосом.',
    delay: 1000
  }
];

/**
 * Быстрый диалог - проверка производительности
 */
export const rapidFireScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Куб',
    delay: 500
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 200
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 400
  },
  {
    type: 'assistant',
    text: 'Создан куб',
    delay: 300
  },
  {
    type: 'user',
    text: 'Красный',
    delay: 500
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 200
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 400
  },
  {
    type: 'assistant',
    text: 'Изменён на красный',
    delay: 300
  },
  {
    type: 'user',
    text: 'Больше',
    delay: 500
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 200
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 400
  },
  {
    type: 'assistant',
    text: 'Увеличен размер',
    delay: 300
  }
];

/**
 * Длинный thinking процесс
 */
export const longThinkingScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Создай интерактивную 3D визуализацию алгоритма сортировки пузырьком',
    delay: 1000
  },
  {
    type: 'thinking',
    text: 'Это интересная задача. Мне нужно визуализировать сортировку в 3D...',
    delay: 1500
  },
  {
    type: 'thinking',
    text: 'Создам массив кубов разной высоты, где высота = значение элемента...',
    delay: 2000
  },
  {
    type: 'thinking',
    text: 'Нужна анимация обмена элементов с плавным перемещением кубов...',
    delay: 1800
  },
  {
    type: 'thinking',
    text: 'Добавлю подсветку сравниваемых элементов (красным цветом)...',
    delay: 1500
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 800
  },
  {
    type: 'thinking',
    text: 'Генерирую код для создания массива кубов...',
    delay: 2000
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 2500
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Создаю систему анимации сортировки...',
    delay: 2200
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 2500
  },
  {
    type: 'assistant',
    text: 'Создал 3D визуализацию bubble sort! 10 кубов разной высоты будут сортироваться. Красным подсвечиваются сравниваемые элементы. Скажи "старт" чтобы начать анимацию.',
    delay: 1000
  }
];

// Export all scenarios
export const scenarios = {
  basic: basicScenario,
  game: gameCreationScenario,
  error: errorRecoveryScenario,
  complex: complexTaskScenario,
  rapid: rapidFireScenario,
  thinking: longThinkingScenario
};
