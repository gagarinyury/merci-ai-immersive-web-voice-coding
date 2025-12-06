/**
 * Test Canvas Panel System
 *
 * Простая Canvas панель на чистом Three.js
 */

import { createSystem } from '@iwsdk/core';
import * as THREE from 'three';

export class TestCanvasPanelSystem extends createSystem({}) {
  private panelMesh: THREE.Mesh | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private texture: THREE.CanvasTexture | null = null;

  init() {
    console.log('🎨 TestCanvasPanelSystem: Initializing Canvas panel...');

    // Plant position (from src/index.ts:85)
    const plantPosition = new THREE.Vector3(1.2, 0.2, -1.8);

    // Create test panel opposite to plant
    this.createTestPanel(plantPosition);
  }

  /**
   * Создать простую Canvas панель
   */
  private createTestPanel(plantPosition: THREE.Vector3) {
    try {
      // Create canvas
      this.canvas = document.createElement('canvas');
      this.canvas.width = 512;
      this.canvas.height = 512;
      this.ctx = this.canvas.getContext('2d');

      if (!this.ctx) {
        console.error('❌ Failed to get canvas context');
        return;
      }

      // Draw initial content
      this.drawCanvasContent();

      // Create texture from canvas
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.needsUpdate = true;

      // Create mesh
      const geometry = new THREE.PlaneGeometry(1.5, 1.5);
      const material = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.panelMesh = new THREE.Mesh(geometry, material);

      // Position panel on the LEFT side (same side as robot, opposite to plant)
      // Plant is at +1.2 (right), so panel at -1.2 (left)
      const panelPosition = new THREE.Vector3(
        -1.2,  // Left side (where robot is)
        plantPosition.y + 1.5,  // 1.5m above ground
        plantPosition.z  // Same Z as plant
      );

      this.panelMesh.position.copy(panelPosition);

      // Make panel face camera (lookAt origin for now)
      const cameraPosition = new THREE.Vector3(0, 1.6, 0); // Default camera height
      this.panelMesh.lookAt(cameraPosition);

      // Add to scene through IWSDK
      this.world.createTransformEntity(this.panelMesh);

      console.log('✅ Canvas panel created at position:', panelPosition);
      console.log('📐 Panel mesh:', this.panelMesh);

    } catch (error) {
      console.error('❌ Failed to create Canvas panel:', error);
    }
  }

  /**
   * Рисовать контент на Canvas
   */
  private drawCanvasContent() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, 70);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas Panel Test', width / 2, 45);

    // Main content
    ctx.fillStyle = '#0f0';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const lines = [
      'This is a simple Canvas panel!',
      '',
      'Features:',
      '- Pure Three.js CanvasTexture',
      '- No external dependencies',
      '- Full emoji support: 👋 🎨 ✅',
      '- Real-time updates'
    ];
    let y = 110;
    lines.forEach(line => {
      ctx.fillText(line, 30, y);
      y += 30;
    });

    // Footer
    ctx.fillStyle = '#000';
    ctx.fillRect(0, height - 70, width, 70);
    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VRCreator2', width / 2, height - 35);
  }

  /**
   * Update panel to always face camera
   */
  update() {
    if (!this.panelMesh || !this.texture) return;

    // Update texture (in case canvas changed)
    this.texture.needsUpdate = true;

    // Make panel face camera (IWSDK camera is in world.camera)
    if (this.world.camera) {
      this.panelMesh.lookAt(this.world.camera.position);
    }
  }
}
