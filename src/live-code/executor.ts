/**
 * Code Executor
 *
 * Выполняет JavaScript код в контексте IWSDK World
 */

import type { World } from '@iwsdk/core';
import * as IWSDKCore from '@iwsdk/core';

export class CodeExecutor {
  constructor(private world: World) {
    this.setupGlobalScope();
  }

  /**
   * Настраивает глобальные объекты для выполнения кода
   */
  private setupGlobalScope() {
    const w = window as any;

    // Создаем глобальный объект THREE из IWSDK exports
    w.THREE = {
      // Geometries
      SphereGeometry: IWSDKCore.SphereGeometry,
      BoxGeometry: IWSDKCore.BoxGeometry,
      CylinderGeometry: IWSDKCore.CylinderGeometry,
      PlaneGeometry: IWSDKCore.PlaneGeometry,
      TorusGeometry: IWSDKCore.TorusGeometry,
      ConeGeometry: IWSDKCore.ConeGeometry,

      // Materials
      MeshStandardMaterial: IWSDKCore.MeshStandardMaterial,
      MeshBasicMaterial: IWSDKCore.MeshBasicMaterial,
      MeshPhongMaterial: IWSDKCore.MeshPhongMaterial,

      // Core
      Mesh: IWSDKCore.Mesh,
      Group: IWSDKCore.Group,
      Object3D: IWSDKCore.Object3D,

      // Math
      Vector3: IWSDKCore.Vector3,
      Euler: IWSDKCore.Euler,
      Quaternion: IWSDKCore.Quaternion,

      // Colors
      Color: IWSDKCore.Color,

      // Lights
      PointLight: IWSDKCore.PointLight,
      DirectionalLight: IWSDKCore.DirectionalLight,
      AmbientLight: IWSDKCore.AmbientLight,
      SpotLight: IWSDKCore.SpotLight,

      // Textures
      CanvasTexture: IWSDKCore.CanvasTexture,
      Texture: IWSDKCore.Texture,
    };

    // Делаем IWSDK компоненты глобальными
    w.Interactable = IWSDKCore.Interactable;
    w.DistanceGrabbable = IWSDKCore.DistanceGrabbable;
    w.AudioSource = IWSDKCore.AudioSource;
    w.PanelUI = IWSDKCore.PanelUI;
    w.ScreenSpace = IWSDKCore.ScreenSpace;
  }

  /**
   * Выполняет JavaScript код с доступом к world и глобальным объектам
   */
  execute(code: string): { success: boolean; result?: any; error?: string } {
    try {
      // Делаем world доступным глобально
      (window as any).__IWSDK_WORLD__ = this.world;

      // Выполняем код напрямую через eval для доступа к глобальному scope
      // eslint-disable-next-line no-eval
      const result = eval(code);

      console.log('✅ Code executed successfully');
      return { success: true, result };
    } catch (error) {
      console.error('❌ Code execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
