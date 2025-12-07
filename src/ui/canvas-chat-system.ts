/**
 * Canvas Chat System
 *
 * iMessage-style chat на Canvas панели
 * РЕФАКТОРИНГ: Делегирование к MessageManager и CanvasRenderer
 */

import { createSystem, Interactable } from '@iwsdk/core';
import * as THREE from 'three';
import { CanvasChatPanel, MicButton } from './canvas-chat-interaction';
import { GeminiAudioService } from '../services/gemini-audio-service';
import { AudioFeedbackService } from '../services/audio-feedback';
import { SSEConversationClient } from '../services/sse-conversation-client';
import { MessageManager } from './message-manager';
import { CanvasRenderer } from './canvas-renderer';

export class CanvasChatSystem extends createSystem({}) {
  // Public for interaction system
  public panelMesh: THREE.Mesh | null = null;
  public micButtonMesh: THREE.Mesh | null = null;

  // Components (делегирование)
  private messageManager!: MessageManager;
  private canvasRenderer!: CanvasRenderer;

  // Services
  private voiceService!: GeminiAudioService;
  private audioFeedback!: AudioFeedbackService;
  private sseClient!: SSEConversationClient;

  // Voice recording state
  private isRecording = false;
  private recordingStatusText = '';

  init() {
    console.log('💬 CanvasChatSystem: Initializing iMessage-style chat...');

    // Initialize components
    this.messageManager = new MessageManager();
    this.canvasRenderer = new CanvasRenderer(1024, 1024);

    // Initialize services
    this.voiceService = new GeminiAudioService();
    this.audioFeedback = new AudioFeedbackService();
    this.sseClient = new SSEConversationClient();

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Microphone not supported - voice input disabled');
    }

    // Plant position
    const plantPosition = new THREE.Vector3(1.2, 0.2, -1.8);

    // Create chat panel
    this.createChatPanel(plantPosition);

    // Create 3D mic button
    this.create3DMicButton(plantPosition);
  }

  /**
   * Создать Canvas чат панель
   */
  private createChatPanel(plantPosition: THREE.Vector3) {
    try {
      // Initial render
      this.render();

      // Create mesh with renderer's texture
      const geometry = new THREE.PlaneGeometry(2.5, 2.5);
      const material = new THREE.MeshBasicMaterial({
        map: this.canvasRenderer.getTexture(),
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        alphaTest: 0.01
      });
      this.panelMesh = new THREE.Mesh(geometry, material);

      // Position panel rotated 30 degrees to the left from center
      // Using polar coordinates: radius=2m, angle=30° left
      const angle = THREE.MathUtils.degToRad(30); // 30 degrees left
      const radius = 2.0; // Distance from camera
      const panelPosition = new THREE.Vector3(
        -Math.sin(angle) * radius, // X: left is negative
        1.5,                        // Y: eye level
        -Math.cos(angle) * radius   // Z: forward is negative
      );
      this.panelMesh.position.copy(panelPosition);

      // Make panel face camera
      const cameraPosition = new THREE.Vector3(0, 1.6, 0);
      this.panelMesh.lookAt(cameraPosition);

      // Add to scene
      const entity = this.world.createTransformEntity(this.panelMesh);
      entity.addComponent(Interactable);
      entity.addComponent(CanvasChatPanel);

      console.log('✅ Canvas chat panel created at position:', panelPosition);

    } catch (error) {
      console.error('❌ Failed to create Canvas chat panel:', error);
    }
  }

  /**
   * Создать 3D кнопку микрофона (в центре панели)
   */
  private create3DMicButton(plantPosition: THREE.Vector3) {
    try {
      // Create sphere in center of panel (30cm diameter)
      const geometry = new THREE.SphereGeometry(0.15, 32, 32);

      // Less transparent material
      const material = new THREE.MeshStandardMaterial({
        color: 0x007AFF,
        transparent: true,
        opacity: 0.8,  // Менее прозрачная
        metalness: 0.3,
        roughness: 0.4
      });

      this.micButtonMesh = new THREE.Mesh(geometry, material);

      // Position sphere at bottom center of panel
      const angle = THREE.MathUtils.degToRad(30); // 30 degrees left
      const radius = 2.0; // Same distance as panel
      const panelPosition = new THREE.Vector3(
        -Math.sin(angle) * radius, // X: left is negative
        1.5,                        // Y: eye level (same as panel)
        -Math.cos(angle) * radius   // Z: forward is negative
      );

      // Offset to bottom of panel (panel height = 2.5m, so bottom is -1.25m from center)
      const offsetY = -1.0; // Move down from panel center

      this.micButtonMesh.position.set(
        panelPosition.x,
        panelPosition.y + offsetY,
        panelPosition.z + 0.1  // Slightly in front of panel
      );

      // Add to scene through IWSDK with Interactable + MicButton components
      const entity = this.world.createTransformEntity(this.micButtonMesh);
      entity.addComponent(Interactable);
      entity.addComponent(MicButton);

      console.log('✅ 3D Mic button created (invisible overlay on Canvas button)');
      console.log('🎤 Hold trigger on mic button to record');

    } catch (error) {
      console.error('❌ Failed to create 3D mic button:', error);
    }
  }


  /**
   * Добавить сообщение пользователя
   */
  addUserMessage(text: string) {
    this.messageManager.addUserMessage(text);
    this.render();
  }

  /**
   * Добавить сообщение ассистента
   */
  addAssistantMessage(text: string) {
    this.messageManager.addAssistantMessage(text);
    this.render();
  }

  /**
   * Очистить все сообщения
   */
  clearMessages() {
    this.messageManager.clear();
    this.render();
  }

  /**
   * Render chat UI (делегирование к CanvasRenderer)
   */
  private render() {
    const messages = this.messageManager.getMessages();
    this.canvasRenderer.render(messages, this.isRecording, this.recordingStatusText);
  }

  /**
   * Start recording (push-to-talk pressed)
   */
  async startRecording() {
    if (this.isRecording) return;

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Voice input not supported');
      this.recordingStatusText = 'Microphone unavailable';
      this.render();
      return;
    }

    try {
      this.isRecording = true;
      this.recordingStatusText = 'Listening';
      await this.voiceService.start();
      this.audioFeedback.playRecordingStart();
      this.render();
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.isRecording = false;
      this.recordingStatusText = 'Recording failed';
      this.render();
    }
  }

  /**
   * Stop recording and send (push-to-talk released)
   */
  async stopRecording() {
    if (!this.isRecording) return;

    try {
      this.isRecording = false;
      this.recordingStatusText = 'Transcribing';
      this.audioFeedback.playRecordingStop();
      this.render();

      console.log('⏹️ Recording stopped - transcribing...');
      const transcribedText = await this.voiceService.stop();

      if (transcribedText) {
        console.log('✅ Transcribed:', transcribedText);
        this.recordingStatusText = '';
        await this.sendMessage(transcribedText);
      } else {
        console.warn('⚠️ Empty transcription');
        this.audioFeedback.playError();
        this.recordingStatusText = 'Could not transcribe';
        this.render();

        setTimeout(() => {
          this.recordingStatusText = '';
          this.render();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Failed to transcribe:', error);
      this.audioFeedback.playError();
      this.isRecording = false;
      this.recordingStatusText = 'Transcription failed';
      this.render();

      setTimeout(() => {
        this.recordingStatusText = '';
        this.render();
      }, 2000);
    }
  }

  /**
   * Show tool execution progress (делегирование к MessageManager)
   */
  showToolProgress(toolName: string, status: 'starting' | 'completed' | 'failed', error?: string) {
    this.messageManager.showToolProgress(toolName, status, error);
    this.render();
  }

  /**
   * Show agent thinking message (делегирование к MessageManager)
   */
  showThinkingMessage(text: string) {
    this.messageManager.showThinkingMessage(text);
    this.render();
  }

  /**
   * Start streaming message (делегирование к MessageManager)
   */
  startStreamingMessage(messageId: string, role: 'user' | 'assistant') {
    this.messageManager.startStreamingMessage(messageId, role);
    this.render();
  }

  /**
   * Append text chunk to streaming message (делегирование к MessageManager)
   */
  appendToStreamingMessage(messageId: string, textChunk: string) {
    this.messageManager.appendToStreamingMessage(messageId, textChunk);
    this.render();
  }

  /**
   * End streaming message (делегирование к MessageManager)
   */
  endStreamingMessage(messageId: string) {
    this.messageManager.endStreamingMessage(messageId);
    this.render();
  }

  /**
   * Send text message (public method for console/external use)
   */
  async sendTextMessage(text: string) {
    await this.sendMessage(text);
  }

  /**
   * Send message to backend conversation API via SSE
   */
  private async sendMessage(text: string) {
    if (!text.trim()) return;

    try {
      // Add user message to UI
      this.addUserMessage(text);

      // Send via SSE and listen for events
      await this.sseClient.sendMessage(text, this.getSessionId(), {
        onToolStart: (toolName) => {
          console.log(`🔧 Tool started: ${toolName}`);
          this.showToolProgress(toolName, 'starting');
        },

        onToolComplete: (toolName) => {
          console.log(`✅ Tool completed: ${toolName}`);
          this.showToolProgress(toolName, 'completed');
        },

        onToolFailed: (toolName, error) => {
          console.log(`❌ Tool failed: ${toolName}`, error);
          this.showToolProgress(toolName, 'failed', error);
        },

        onThinking: (thinkingText) => {
          console.log(`💭 Thinking: ${thinkingText.substring(0, 50)}...`);
          this.showThinkingMessage(thinkingText);
        },

        onDone: (response, newSessionId) => {
          console.log('✅ Conversation done:', response.substring(0, 60));

          // Update session ID if changed
          if (newSessionId) {
            (window as any).__VR_SESSION_ID__ = newSessionId;
          }

          // Add final response
          this.addAssistantMessage(response);

          // Play success sound
          this.audioFeedback.playSuccess();

          this.render();
        },

        onError: (error) => {
          console.error('❌ SSE error:', error);
          this.addAssistantMessage(`Error: ${error}`);

          // Play error sound
          this.audioFeedback.playError();

          this.render();
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      this.addAssistantMessage('Failed to connect to backend');

      // Play error sound
      this.audioFeedback.playError();

      this.render();
    }
  }

  /**
   * Get canvas element (for external access)
   */
  get canvas(): HTMLCanvasElement | null {
    return this.canvasRenderer?.getCanvas() || null;
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (!(window as any).__VR_SESSION_ID__) {
      (window as any).__VR_SESSION_ID__ = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 New session started:', (window as any).__VR_SESSION_ID__);
    }
    return (window as any).__VR_SESSION_ID__;
  }

  /**
   * Update panel to always face camera
   */
  private lastRenderTime = 0;
  private readonly RENDER_INTERVAL = 500; // 500ms for animated dots

  update() {
    if (!this.panelMesh) return;

    // Make panel face camera
    if (this.world.camera) {
      this.panelMesh.lookAt(this.world.camera.position);
    }

    // Animate mic button during recording (red pulsing)
    if (this.micButtonMesh) {
      const material = this.micButtonMesh.material as THREE.MeshStandardMaterial;

      if (this.isRecording) {
        // Pulsing red animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5; // Oscillates 0-1

        // Red color
        material.color.setHex(0xff3b30);

        // Pulsing opacity
        material.opacity = 0.6 + pulse * 0.4; // 0.6-1.0

        // Pulsing scale
        const scale = 1.0 + pulse * 0.2; // 1.0-1.2
        this.micButtonMesh.scale.setScalar(scale);
      } else {
        // Normal state - blue
        material.color.setHex(0x007AFF);
        material.opacity = 0.8;
        this.micButtonMesh.scale.setScalar(1.0);
      }
    }

    // Periodic render for animated dots
    if (this.recordingStatusText) {
      const now = Date.now();
      if (now - this.lastRenderTime > this.RENDER_INTERVAL) {
        this.render();
        this.lastRenderTime = now;
      }
    }
  }
}
