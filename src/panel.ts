import {
  createSystem,
  PanelUI,
  PanelDocument,
  eq,
  VisibilityState,
  UIKitDocument,
  UIKit,
} from "@iwsdk/core";

import { cyrillicFontFamilies, DEFAULT_FONT_FAMILY } from "./fonts/cyrillic-font.js";
import { GeminiAudioService } from "./services/gemini-audio-service.js";
import { chatSystem } from "./chat-system.js";

export class PanelSystem extends createSystem({
  welcomePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, "config", "./ui/welcome.json")],
  },
}) {
  private voiceService!: GeminiAudioService;
  private isRecording = false;

  init() {
    // Initialize voice service
    this.voiceService = new GeminiAudioService();
    this.queries.welcomePanel.subscribe("qualify", (entity) => {
      const document = PanelDocument.data.document[
        entity.index
      ] as UIKitDocument;
      if (!document) {
        return;
      }

      // Setup Cyrillic font support
      const rootElement = document.rootElement as UIKit.Container;
      if (rootElement && typeof rootElement.setProperties === 'function') {
        rootElement.setProperties({
          fontFamilies: cyrillicFontFamilies,
          fontFamily: DEFAULT_FONT_FAMILY,
        } as any);
      }

      const xrButton = document.getElementById("xr-button") as UIKit.Text;
      xrButton.addEventListener("click", () => {
        if (this.world.visibilityState.value === VisibilityState.NonImmersive) {
          this.world.launchXR();
        } else {
          this.world.exitXR();
        }
      });
      this.world.visibilityState.subscribe((visibilityState) => {
        if (visibilityState === VisibilityState.NonImmersive) {
          xrButton.setProperties({ text: "Enter XR" });
        } else {
          xrButton.setProperties({ text: "Exit to Browser" });
        }
      });

      // Export document to window for external access (e.g., tests)
      (window as any).__PANEL_DOCUMENT__ = document;
      (window as any).__PANEL_ENTITY__ = entity;

      // Setup voice input on MIC button
      this.setupVoiceInput(document);
    });
  }

  /**
   * Setup voice input with push-to-talk
   */
  private setupVoiceInput(document: UIKitDocument) {
    const micButton = document.getElementById("send-btn") as UIKit.Text;
    const messageInput = document.getElementById("message-input") as UIKit.Input;

    if (!micButton) {
      console.warn('⚠️ MIC button not found');
      return;
    }

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Microphone not supported');
      micButton.setProperties({ text: '🚫' });
      return;
    }

    // Push-to-talk: pointerdown = start recording
    micButton.addEventListener("pointerdown", async () => {
      if (this.isRecording) return;

      try {
        this.isRecording = true;
        await this.voiceService.start();

        // Visual feedback: red = recording
        micButton.setProperties({
          backgroundColor: 'rgba(255, 0, 0, 0.9)',
          text: '🎤'
        });

        console.log('🎤 Recording started');
      } catch (error) {
        console.error('Failed to start recording:', error);
        this.isRecording = false;
        micButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      }
    });

    // Release = stop recording and transcribe
    micButton.addEventListener("pointerup", async () => {
      if (!this.isRecording) return;

      try {
        // Visual feedback: yellow = processing
        micButton.setProperties({
          backgroundColor: 'rgba(255, 204, 0, 0.9)',
          text: '⏳'
        });

        const transcribedText = await this.voiceService.stop();
        this.isRecording = false;

        if (transcribedText) {
          console.log('✅ Transcribed:', transcribedText);

          // Insert text into input field (or directly send)
          if (messageInput) {
            messageInput.setProperties({ value: transcribedText });
          }

          // Optionally: auto-send message
          await this.sendMessage(transcribedText);
        } else {
          console.warn('⚠️ Empty transcription');
        }

        // Reset button
        micButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      } catch (error) {
        console.error('Failed to transcribe:', error);
        this.isRecording = false;
        micButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      }
    });

    console.log('✅ Voice input initialized (push-to-talk)');
  }

  /**
   * Send message to backend conversation API
   */
  private async sendMessage(text: string) {
    if (!text.trim()) return;

    try {
      // Add user message to UI
      chatSystem.addUserMessage(text);

      // Send to backend
      const response = await fetch('http://localhost:3001/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: this.getSessionId(),
        }),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        // Add assistant response to UI
        chatSystem.addAssistantMessage(data.reply);
      } else {
        console.error('Backend error:', data.error);
        chatSystem.addAssistantMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      chatSystem.addAssistantMessage('Failed to connect to backend');
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = localStorage.getItem('vr_creator_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('vr_creator_session_id', sessionId);
    }
    return sessionId;
  }
}
