import { useState, useCallback, useEffect, useRef } from 'react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type ChatMode = 'voice' | 'text';
type VoiceState = 'idle' | 'listening' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceWidget() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const conversationRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      alert('Microphone access is required for voice calls. Please allow microphone access and try again.');
      return false;
    }
  };

  // Get signed URL from our backend
  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch('/api/elevenlabs/signed-url');
    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }
    const data = await response.json();
    return data.signedUrl;
  };

  // Start voice conversation
  const startVoiceConversation = useCallback(async () => {
    if (status !== 'disconnected') return;

    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    setChatMode('voice');
    setStatus('connecting');
    setShowModeSelector(false);

    try {
      const { Conversation } = await import('@11labs/client');
      const signedUrl = await getSignedUrl();

      const conv = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus('connected');
          console.log('[VoiceWidget] Voice connected');
        },
        onDisconnect: () => {
          setStatus('disconnected');
          conversationRef.current = null;
          setChatMode(null);
          console.log('[VoiceWidget] Disconnected');
        },
        onError: (error: any) => {
          console.error('[VoiceWidget] Error:', error);
          setStatus('disconnected');
          conversationRef.current = null;
          setChatMode(null);
        },
        onModeChange: (mode: any) => {
          console.log('[VoiceWidget] Mode:', mode.mode);
          // Update voice state for dynamic animation
          if (mode.mode === 'speaking') {
            setVoiceState('speaking');
          } else if (mode.mode === 'listening') {
            setVoiceState('listening');
          } else {
            setVoiceState('idle');
          }
        },
      });

      conversationRef.current = conv;
    } catch (error) {
      console.error('[VoiceWidget] Failed to start voice:', error);
      setStatus('disconnected');
      setChatMode(null);
      alert('Failed to start voice call. Please try again.');
    }
  }, [status]);

  // Start text conversation
  const startTextConversation = useCallback(async () => {
    if (status !== 'disconnected') return;

    setChatMode('text');
    setStatus('connecting');
    setShowModeSelector(false);
    setMessages([]);

    try {
      const { Conversation } = await import('@11labs/client');
      const signedUrl = await getSignedUrl();

      const conv = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus('connected');
          console.log('[VoiceWidget] Text chat connected');
          // Focus input after connection
          setTimeout(() => inputRef.current?.focus(), 100);
        },
        onDisconnect: () => {
          setStatus('disconnected');
          conversationRef.current = null;
          setChatMode(null);
          console.log('[VoiceWidget] Disconnected');
        },
        onError: (error: any) => {
          console.error('[VoiceWidget] Error:', error);
          setStatus('disconnected');
          conversationRef.current = null;
          setChatMode(null);
        },
        onMessage: (message: any) => {
          console.log('[VoiceWidget] Message received:', JSON.stringify(message, null, 2));
          // Handle different message formats from ElevenLabs
          const content = message.message || message.text || message.content;
          const source = message.source || message.role || 'unknown';

          if (content && (source === 'ai' || source === 'assistant' || source === 'unknown')) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              timestamp: new Date()
            }]);
          } else if (content && source === 'user') {
            // User message echo - ignore as we already added it
            console.log('[VoiceWidget] User message echo, ignoring');
          }
        },
        onModeChange: (mode: any) => {
          console.log('[VoiceWidget] Mode:', mode.mode);
          if (mode.mode === 'speaking') {
            setIsTyping(true);
          }
        },
      });

      // Mute the audio output for text mode (we don't want voice)
      conv.setVolume({ volume: 0 });
      conversationRef.current = conv;
    } catch (error) {
      console.error('[VoiceWidget] Failed to start text chat:', error);
      setStatus('disconnected');
      setChatMode(null);
      alert('Failed to start chat. Please try again.');
    }
  }, [status]);

  // Send text message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !conversationRef.current) {
      console.log('[VoiceWidget] Cannot send: no input or no conversation');
      return;
    }

    const messageText = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      console.log('[VoiceWidget] Sending message:', messageText);
      // Use sendUserMessage - the correct ElevenLabs SDK method for text input
      conversationRef.current.sendUserMessage(messageText);
      console.log('[VoiceWidget] Message sent successfully');
    } catch (error) {
      console.error('[VoiceWidget] Failed to send message:', error);
      setIsTyping(false);
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    }
  }, [inputText]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // End conversation
  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setStatus('disconnected');
      setChatMode(null);
      setMessages([]);
    }
  }, []);

  // Toggle mute (voice mode only)
  const toggleMute = useCallback(() => {
    if (conversationRef.current && chatMode === 'voice') {
      if (isMuted) {
        conversationRef.current.setVolume({ volume: 1 });
      } else {
        conversationRef.current.setVolume({ volume: 0 });
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted, chatMode]);

  // Show mode selector - handles both click and touch
  const handleWidgetClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'disconnected') {
      setShowModeSelector(true);
    }
  };

  // Close mode selector
  const closeModeSelector = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowModeSelector(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
    };
  }, []);

  // Auto-hide label after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabel(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Show label on hover
  useEffect(() => {
    if (isHovered) {
      setShowLabel(true);
    }
  }, [isHovered]);

  return (
    <div
      className="voice-widget-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mode selector popup */}
      {showModeSelector && status === 'disconnected' && (
        <>
          <div
            className="voice-widget-overlay"
            onClick={closeModeSelector}
            onTouchEnd={closeModeSelector}
          ></div>
          <div className="voice-widget-mode-selector" onClick={(e) => e.stopPropagation()}>
            <div className="voice-widget-mode-header">
              <span>Chat with our AI</span>
              <button
                className="voice-widget-close"
                onClick={closeModeSelector}
                onTouchEnd={closeModeSelector}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="voice-widget-mode-options">
              <button
                className="voice-widget-mode-option voice-widget-mode-recommended"
                onClick={(e) => { e.stopPropagation(); startVoiceConversation(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); startVoiceConversation(); }}
              >
                <div className="voice-widget-mode-badge">Recommended</div>
                <div className="voice-widget-mode-icon voice-mode">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-3.07z"/>
                  </svg>
                </div>
                <div className="voice-widget-mode-content">
                  <span className="voice-widget-mode-label">Voice Call</span>
                  <span className="voice-widget-mode-desc">Talk directly with our AI assistant</span>
                </div>
              </button>
              <button
                className="voice-widget-mode-option"
                onClick={(e) => { e.stopPropagation(); startTextConversation(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); startTextConversation(); }}
              >
                <div className="voice-widget-mode-icon text-mode">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                  </svg>
                </div>
                <div className="voice-widget-mode-content">
                  <span className="voice-widget-mode-label">Text Chat</span>
                  <span className="voice-widget-mode-desc">Prefer typing? Chat here</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Text chat window */}
      {chatMode === 'text' && status === 'connected' && (
        <div className="voice-widget-chat-window">
          <div className="voice-widget-chat-header">
            <div className="voice-widget-chat-title">
              <span className="voice-widget-live-dot"></span>
              <span>AI Assistant</span>
            </div>
            <button className="voice-widget-chat-close" onClick={endConversation}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className="voice-widget-chat-messages">
            {messages.length === 0 && !isTyping && (
              <div className="voice-widget-chat-welcome">
                <p>Connecting to AI assistant...</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`voice-widget-chat-message ${msg.role}`}>
                <div className="voice-widget-chat-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="voice-widget-chat-message assistant">
                <div className="voice-widget-chat-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="voice-widget-chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="voice-widget-send-btn"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating label hook */}
      {status === 'disconnected' && !showModeSelector && (
        <div className={`voice-widget-label ${showLabel ? 'visible' : ''}`}>
          <span className="voice-widget-label-text">Talk to AI</span>
          <div className="voice-widget-label-arrow"></div>
        </div>
      )}

      {/* Main button - disconnected state */}
      {status === 'disconnected' && !showModeSelector && (
        <button
          className="voice-widget-button voice-widget-idle"
          onClick={handleWidgetClick}
          onTouchEnd={handleWidgetClick}
          aria-label="Start conversation"
        >
          <div className="voice-widget-ring voice-widget-ring-1"></div>
          <div className="voice-widget-ring voice-widget-ring-2"></div>
          <div className="voice-widget-ring voice-widget-ring-3"></div>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-3.07z"/>
          </svg>
        </button>
      )}

      {/* Connecting state */}
      {status === 'connecting' && (
        <button
          className="voice-widget-button voice-widget-connecting"
          disabled
          aria-label="Connecting..."
        >
          <div className="voice-widget-spinner"></div>
        </button>
      )}

      {/* Voice mode - connected state */}
      {chatMode === 'voice' && status === 'connected' && (
        <div className="voice-widget-active">
          <div className={`voice-widget-live-label ${voiceState}`}>
            <span className="voice-widget-live-dot"></span>
            <span>{voiceState === 'speaking' ? 'Speaking' : voiceState === 'listening' ? 'Listening' : 'Live'}</span>
          </div>
          <button
            className={`voice-widget-button voice-widget-live ${voiceState}`}
            onClick={endConversation}
            aria-label="End call"
          >
            <div className={`voice-widget-soundwave ${voiceState}`}>
              <div className="voice-widget-bar"></div>
              <div className="voice-widget-bar"></div>
              <div className="voice-widget-bar"></div>
              <div className="voice-widget-bar"></div>
              <div className="voice-widget-bar"></div>
            </div>
          </button>
          <button
            className={`voice-widget-mute ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Text mode - minimized button when chat is open */}
      {chatMode === 'text' && status === 'connected' && (
        <button
          className="voice-widget-button voice-widget-text-active"
          onClick={() => {}}
          aria-label="Chat active"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default VoiceWidget;
