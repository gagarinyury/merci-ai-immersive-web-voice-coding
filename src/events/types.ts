/**
 * Event Client Types
 *
 * Types for WebSocket events between backend and frontend
 */

export interface EventMessage {
  action:
  | 'connected'
  | 'tool_use_start'
  | 'tool_use_complete'
  | 'tool_use_failed'
  | 'agent_thinking'
  | 'scene_data'
  | 'console_log';

  message?: string;
  timestamp?: number;

  // Tool use progress fields
  toolName?: string;
  toolInput?: any;
  toolUseId?: string;
  error?: string;

  // Agent thinking
  text?: string;

  // Scene Understanding data (Quest → Backend)
  sessionId?: string;
  sceneData?: SceneSnapshot;

  // Console log from Quest
  logLevel?: 'log' | 'warn' | 'error' | 'info';
  logArgs?: any[];
}

// Scene Understanding snapshot from Quest
export interface SceneSnapshot {
  planes: Array<{
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: [number, number, number];
    dimensions: [number, number];
  }>;
  meshes: Array<{
    id: string;
    semanticLabel: string;
    position: [number, number, number];
    dimensions: [number, number, number];
    boundingBox: {
      min: [number, number, number];
      max: [number, number, number];
    };
    isBounded3D?: boolean;
  }>;
}
