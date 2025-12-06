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
  private lastInputValue = '';
  private buttonMode: 'mic' | 'send' = 'mic';

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
   * Setup voice input with push-to-talk and text input with Enter to send
   */
  private setupVoiceInput(document: UIKitDocument) {
    const sendButton = document.getElementById("send-btn") as UIKit.Text;
    const messageInput = document.getElementById("message-input") as UIKit.Input;

    if (!sendButton) {
      console.warn('⚠️ Send button not found');
      return;
    }

    if (!messageInput) {
      console.warn('⚠️ Message input not found');
      return;
    }

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Microphone not supported');
      sendButton.setProperties({ text: '🚫' });
      return;
    }

    // DEBUG: посмотрим что внутри Input
    console.log('🔍 Input type:', (messageInput as any).constructor.name);
    console.log('🔍 Input.element:', (messageInput as any).element);
    console.log('🔍 Input.currentSignal:', (messageInput as any).currentSignal);
    console.log('🔍 Input.hasFocus:', (messageInput as any).hasFocus);

    // Helper to get input value from currentSignal (ПРАВИЛЬНЫЙ СПОСОБ!)
    const getInputValue = (): string => {
      try {
        // Input имеет currentSignal с текущим значением
        const currentSignal = (messageInput as any).currentSignal;
        if (currentSignal && typeof currentSignal.value !== 'undefined') {
          return String(currentSignal.value || '');
        }

        // Fallback: читаем из HTML element напрямую
        const element = (messageInput as any).element;
        if (element && typeof element.value === 'string') {
          return element.value;
        }
      } catch (e) {
        console.warn('⚠️ Error reading input value:', e);
      }
      return '';
    };

    // Helper to send text message
    const sendTextMessage = async () => {
      const text = getInputValue();
      console.log('📤 Sending text:', text);

      if (text.trim()) {
        await this.sendMessage(text.trim());
        // Clear input after sending
        messageInput.setProperties({ value: '' });
        console.log('✅ Message sent, input cleared');
      }
    };

    // Listen for Enter key DIRECTLY on HTML element
    try {
      const htmlElement = (messageInput as any).element as HTMLInputElement;
      if (htmlElement) {
        htmlElement.addEventListener('keydown', (event: KeyboardEvent) => {
          console.log('⌨️ Key pressed:', event.key, event.code);

          if (event.key === 'Enter') {
            console.log('↩️ Enter pressed, sending message');
            event.preventDefault();
            sendTextMessage();
          }
        });
        console.log('✅ Enter key listener attached to HTML input element');
      }
    } catch (e) {
      console.warn('⚠️ Could not attach Enter listener:', e);
    }

    // Button click = send text (if has text) or do nothing
    sendButton.addEventListener("click", async () => {
      const text = getInputValue();
      if (text.trim()) {
        await sendTextMessage();
      }
    });

    // Push-to-talk: pointerdown = start recording
    sendButton.addEventListener("pointerdown", async () => {
      if (this.isRecording) return;

      // Only record if input is empty
      const text = getInputValue();
      if (text.trim()) {
        console.log('📝 Input has text, skipping voice recording');
        return;
      }

      try {
        this.isRecording = true;
        await this.voiceService.start();

        // Visual feedback: red = recording
        sendButton.setProperties({
          backgroundColor: 'rgba(255, 0, 0, 0.9)',
          text: 'REC'
        });

        console.log('🎤 Recording started');
      } catch (error) {
        console.error('Failed to start recording:', error);
        this.isRecording = false;
        sendButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      }
    });

    // Release = stop recording and transcribe
    sendButton.addEventListener("pointerup", async () => {
      if (!this.isRecording) return;

      try {
        // Visual feedback: yellow = processing
        sendButton.setProperties({
          backgroundColor: 'rgba(255, 204, 0, 0.9)',
          text: '...'
        });

        const transcribedText = await this.voiceService.stop();
        this.isRecording = false;

        if (transcribedText) {
          console.log('✅ Transcribed:', transcribedText);

          // Voice input: send directly
          await this.sendMessage(transcribedText);
        } else {
          console.warn('⚠️ Empty transcription');
        }

        // Reset button
        sendButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      } catch (error) {
        console.error('Failed to transcribe:', error);
        this.isRecording = false;
        sendButton.setProperties({
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          text: 'MIC'
        });
      }
    });

    console.log('✅ Voice input and Enter-to-send initialized');
  }

  /**
   * Send message to backend conversation API
   */
  private async sendMessage(text: string) {
    if (!text.trim()) return;

    try {
      // Add user message to UI
      chatSystem.addUserMessage(text);

      // Send to backend (use relative URL - Vite proxy handles forwarding)
      const backendUrl = '/api/conversation';

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: this.getSessionId(),
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        // Add assistant response to UI
        chatSystem.addAssistantMessage(data.response);
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
   *
   * ВАЖНО: Генерируем НОВЫЙ sessionId при каждой перезагрузке страницы,
   * чтобы каждая сессия была независимой и логировалась отдельно
   */
  private getSessionId(): string {
    // Используем глобальный sessionId для этой загрузки страницы
    if (!(window as any).__VR_SESSION_ID__) {
      (window as any).__VR_SESSION_ID__ = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 New session started:', (window as any).__VR_SESSION_ID__);
    }
    return (window as any).__VR_SESSION_ID__;
  }
}
