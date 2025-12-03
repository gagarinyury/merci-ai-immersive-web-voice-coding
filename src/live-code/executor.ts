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
      RingGeometry: IWSDKCore.RingGeometry,
      CircleGeometry: IWSDKCore.CircleGeometry,
      TetrahedronGeometry: IWSDKCore.TetrahedronGeometry,
      OctahedronGeometry: IWSDKCore.OctahedronGeometry,
      IcosahedronGeometry: IWSDKCore.IcosahedronGeometry,
      DodecahedronGeometry: IWSDKCore.DodecahedronGeometry,
      TorusKnotGeometry: IWSDKCore.TorusKnotGeometry,

      // Materials
      MeshStandardMaterial: IWSDKCore.MeshStandardMaterial,
      MeshBasicMaterial: IWSDKCore.MeshBasicMaterial,
      MeshPhongMaterial: IWSDKCore.MeshPhongMaterial,
      LineBasicMaterial: IWSDKCore.LineBasicMaterial,
      LineDashedMaterial: IWSDKCore.LineDashedMaterial,

      // Core
      Mesh: IWSDKCore.Mesh,
      Group: IWSDKCore.Group,
      Object3D: IWSDKCore.Object3D,
      Line: IWSDKCore.Line,
      LineLoop: IWSDKCore.LineLoop,
      LineSegments: IWSDKCore.LineSegments,

      // Math
      Vector3: IWSDKCore.Vector3,
      Vector2: IWSDKCore.Vector2,
      Euler: IWSDKCore.Euler,
      Quaternion: IWSDKCore.Quaternion,
      Matrix4: IWSDKCore.Matrix4,

      // Colors
      Color: IWSDKCore.Color,

      // Lights
      PointLight: IWSDKCore.PointLight,
      DirectionalLight: IWSDKCore.DirectionalLight,
      AmbientLight: IWSDKCore.AmbientLight,
      SpotLight: IWSDKCore.SpotLight,
      HemisphereLight: IWSDKCore.HemisphereLight,

      // Textures
      CanvasTexture: IWSDKCore.CanvasTexture,
      Texture: IWSDKCore.Texture,

      // Helpers
      BufferGeometry: IWSDKCore.BufferGeometry,
      BufferAttribute: IWSDKCore.BufferAttribute,
    };

    // Делаем IWSDK компоненты глобальными
    w.Interactable = IWSDKCore.Interactable;
    w.DistanceGrabbable = IWSDKCore.DistanceGrabbable;
    w.AudioSource = IWSDKCore.AudioSource;
    w.PanelUI = IWSDKCore.PanelUI;
    w.ScreenSpace = IWSDKCore.ScreenSpace;

    // Делаем System доступным для создания кастомных систем
    w.System = IWSDKCore.System;
    w.Component = IWSDKCore.Component;
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
