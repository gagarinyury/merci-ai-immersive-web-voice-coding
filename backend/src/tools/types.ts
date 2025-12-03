/**
 * Types for IWSDK code generation tools
 *
 * Эти типы описывают структуру данных для генерации и редактирования кода
 */

export interface GeneratedCode {
  code: string;
  description: string;
  filename?: string;
}

export interface CodeEditResult {
  code: string;
  changes: string;
}

export interface IWSDKSceneConfig {
  sessionMode: 'ImmersiveVR' | 'ImmersiveAR';
  features?: {
    locomotion?: boolean;
    grabbing?: boolean;
    physics?: boolean;
    sceneUnderstanding?: boolean;
  };
}

export interface IWSDKEntity {
  type: 'mesh' | 'gltf' | 'ui';
  position?: [number, number, number];
  scale?: number | [number, number, number];
  components?: string[];
}
