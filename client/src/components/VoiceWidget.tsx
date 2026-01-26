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

// Session storage keys for persistence
const STORAGE_KEYS = {
  messages: 'voice-widget-messages',
  chatMode: 'voice-widget-mode',
  isOpen: 'voice-widget-open',
};

export function VoiceWidget() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Shows voice/text icons
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [isCallEnding, setIsCallEnding] = useState(false); // For end call animation
  const [liveSubtitle, setLiveSubtitle] = useState<string>(''); // Live transcript
  const [subtitleSource, setSubtitleSource] = useState<'agent' | 'user' | null>(null);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]); // Words currently displayed
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(false);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore session on mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem(STORAGE_KEYS.messages);
    const savedMode = sessionStorage.getItem(STORAGE_KEYS.chatMode);
    const wasOpen = sessionStorage.getItem(STORAGE_KEYS.isOpen);

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error('Failed to restore messages:', e);
      }
    }

    if (savedMode && wasOpen === 'true') {
      setChatMode(savedMode as ChatMode);
      if (savedMode === 'text') {
        setShowChatPanel(true);
      }
    }
  }, []);

  // Save messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    }
  }, [messages]);

  // Save chat state
  useEffect(() => {
    if (chatMode) {
      sessionStorage.setItem(STORAGE_KEYS.chatMode, chatMode);
      sessionStorage.setItem(STORAGE_KEYS.isOpen, String(showChatPanel || status === 'connected'));
    }
  }, [chatMode, showChatPanel, status]);

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
    setIsExpanded(false);

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
          // Trigger the end call animation
          setIsCallEnding(true);
          setVoiceState('idle');
          setLiveSubtitle('');
          setSubtitleSource(null);
          setDisplayedWords([]);
          setIsSubtitleVisible(false);
          // Clear any subtitle animations
          if (wordAnimationRef.current) clearTimeout(wordAnimationRef.current);
          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
          console.log('[VoiceWidget] Disconnected - playing end animation');

          // After animation completes, reset state
          setTimeout(() => {
            setIsCallEnding(false);
            setStatus('disconnected');
            conversationRef.current = null;
            setChatMode(null);
          }, 600); // Match animation duration
        },
        onError: (error: any) => {
          console.error('[VoiceWidget] Error:', error);
          setStatus('disconnected');
          conversationRef.current = null;
          setChatMode(null);
        },
        onModeChange: (mode: any) => {
          console.log('[VoiceWidget] Mode:', mode.mode);
          if (mode.mode === 'speaking') {
            setVoiceState('speaking');
          } else if (mode.mode === 'listening') {
            setVoiceState('listening');
          } else {
            setVoiceState('idle');
          }
        },
        onMessage: (message: any) => {
          console.log('[VoiceWidget] Voice message:', message);
          const text = message.message || message.text || message.content;
          const source = message.source || message.role;

          if (text) {
            // Clear any existing animations
            if (wordAnimationRef.current) {
              clearTimeout(wordAnimationRef.current);
            }
            if (subtitleTimeoutRef.current) {
              clearTimeout(subtitleTimeoutRef.current);
            }
            if (fadeTimeoutRef.current) {
              clearTimeout(fadeTimeoutRef.current);
            }

            // Set the source
            const newSource = source === 'ai' || source === 'agent' || source === 'assistant' ? 'agent' : 'user';
            setSubtitleSource(newSource);
            setLiveSubtitle(text);
            setIsSubtitleVisible(true);

            // Split text into words for typewriter effect
            const words = text.split(' ').filter((w: string) => w.trim());

            // Animate words appearing one by one
            let wordIndex = 0;
            setDisplayedWords([]);

            const animateWords = () => {
              if (wordIndex < words.length) {
                setDisplayedWords(prev => [...prev, words[wordIndex]]);
                wordIndex++;
                // Faster for short responses, slightly slower for longer ones
                const delay = words.length <= 3 ? 120 : words.length <= 8 ? 100 : 80;
                wordAnimationRef.current = setTimeout(animateWords, delay);
              } else {
                // All words displayed - calculate hold time based on length
                // Minimum 2s, add ~150ms per word, max 6s
                const holdTime = Math.min(6000, Math.max(2000, words.length * 150 + 1500));

                subtitleTimeoutRef.current = setTimeout(() => {
                  // Start fade out
                  setIsSubtitleVisible(false);
                  fadeTimeoutRef.current = setTimeout(() => {
                    setLiveSubtitle('');
                    setSubtitleSource(null);
                    setDisplayedWords([]);
                  }, 500); // Match CSS fade duration
                }, holdTime);
              }
            };

            // Start animation immediately
            animateWords();
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
    setIsExpanded(false);
    setChatMode('text');
    setShowChatPanel(true);

    // If we have existing messages, just show the panel (restored session)
    if (messages.length > 0 && status === 'disconnected') {
      // Reconnect to continue conversation
      setStatus('connecting');
    } else if (status === 'disconnected') {
      setStatus('connecting');
      setMessages([]);
    }

    try {
      const { Conversation } = await import('@11labs/client');
      const signedUrl = await getSignedUrl();

      const conv = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus('connected');
          console.log('[VoiceWidget] Text chat connected');
          setTimeout(() => inputRef.current?.focus(), 100);
        },
        onDisconnect: () => {
          setStatus('disconnected');
          conversationRef.current = null;
          console.log('[VoiceWidget] Disconnected');
        },
        onError: (error: any) => {
          console.error('[VoiceWidget] Error:', error);
          setStatus('disconnected');
          conversationRef.current = null;
        },
        onMessage: (message: any) => {
          console.log('[VoiceWidget] Message received:', JSON.stringify(message, null, 2));
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
          }
        },
        onModeChange: (mode: any) => {
          console.log('[VoiceWidget] Mode:', mode.mode);
          if (mode.mode === 'speaking') {
            setIsTyping(true);
          }
        },
      });

      conv.setVolume({ volume: 0 });
      conversationRef.current = conv;
    } catch (error) {
      console.error('[VoiceWidget] Failed to start text chat:', error);
      setStatus('disconnected');
      alert('Failed to start chat. Please try again.');
    }
  }, [status, messages.length]);

  // Send text message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !conversationRef.current) {
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
      conversationRef.current.sendUserMessage(messageText);
    } catch (error) {
      console.error('[VoiceWidget] Failed to send message:', error);
      setIsTyping(false);
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
    }
    setStatus('disconnected');
    setChatMode(null);
    setShowChatPanel(false);
    setVoiceState('idle');
    // Clear stored session
    sessionStorage.removeItem(STORAGE_KEYS.messages);
    sessionStorage.removeItem(STORAGE_KEYS.chatMode);
    sessionStorage.removeItem(STORAGE_KEYS.isOpen);
    setMessages([]);
  }, []);

  // Minimize chat panel (keep conversation alive)
  const minimizeChat = useCallback(() => {
    setShowChatPanel(false);
  }, []);

  // Reopen chat panel
  const reopenChat = useCallback(() => {
    if (chatMode === 'text') {
      setShowChatPanel(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatMode]);

  // Toggle mute
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

  // Toggle expanded state (show voice/text icons)
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Close expanded when clicking outside
  const handleClickOutside = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
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
      {/* Text chat side panel - non-blocking */}
      {showChatPanel && chatMode === 'text' && (
        <div className="voice-widget-side-panel">
          <div className="voice-widget-chat-header">
            <div className="voice-widget-chat-title">
              <span className={`voice-widget-live-dot ${status === 'connected' ? 'active' : ''}`}></span>
              <span>AI Assistant</span>
            </div>
            <div className="voice-widget-header-actions">
              <button className="voice-widget-minimize" onClick={minimizeChat} aria-label="Minimize">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <button className="voice-widget-chat-close" onClick={endConversation} aria-label="Close">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="voice-widget-chat-messages">
            {messages.length === 0 && !isTyping && status === 'connecting' && (
              <div className="voice-widget-chat-welcome">
                <p>Connecting to AI assistant...</p>
              </div>
            )}
            {messages.length === 0 && !isTyping && status === 'connected' && (
              <div className="voice-widget-chat-welcome">
                <p>Hi! How can I help you today?</p>
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
              disabled={status !== 'connected'}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || status !== 'connected'}
              className="voice-widget-send-btn"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating label */}
      {status === 'disconnected' && !isExpanded && !(chatMode === 'text' && messages.length > 0) && (
        <div className={`voice-widget-label ${showLabel ? 'visible' : ''}`}>
          <span className="voice-widget-label-text">Talk to AI</span>
          <div className="voice-widget-label-arrow"></div>
        </div>
      )}

      {/* Inline icon selector - appears when main button is clicked */}
      {isExpanded && status === 'disconnected' && (
        <>
          <div className="voice-widget-backdrop" onClick={handleClickOutside}></div>
          <div className="voice-widget-inline-options">
            <button
              className="voice-widget-inline-btn voice-btn"
              onClick={startVoiceConversation}
              aria-label="Start voice call"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-3.07z"/>
              </svg>
              <span className="voice-widget-inline-tooltip">Voice</span>
            </button>
            <button
              className="voice-widget-inline-btn text-btn"
              onClick={startTextConversation}
              aria-label="Start text chat"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <span className="voice-widget-inline-tooltip">Chat</span>
            </button>
          </div>
        </>
      )}

      {/* Main button - disconnected state (only show if no minimized chat) */}
      {status === 'disconnected' && !isExpanded && !showChatPanel && !(chatMode === 'text' && messages.length > 0) && (
        <button
          className="voice-widget-button voice-widget-idle"
          onClick={toggleExpanded}
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

      {/* Minimized chat indicator - click to reopen */}
      {chatMode === 'text' && !showChatPanel && messages.length > 0 && (
        <button
          className="voice-widget-button voice-widget-minimized"
          onClick={reopenChat}
          aria-label="Reopen chat"
        >
          <span className="voice-widget-unread-badge">{messages.length}</span>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </button>
      )}

      {/* Connecting state */}
      {status === 'connecting' && !showChatPanel && (
        <button
          className="voice-widget-button voice-widget-connecting"
          disabled
          aria-label="Connecting..."
        >
          <div className="voice-widget-spinner"></div>
        </button>
      )}

      {/* Live subtitles - cinematic typewriter effect */}
      {chatMode === 'voice' && status === 'connected' && displayedWords.length > 0 && !isCallEnding && (
        <div className={`voice-widget-subtitle ${subtitleSource === 'agent' ? 'agent' : 'user'} ${!isSubtitleVisible ? 'fading-out' : ''}`}>
          <div className="voice-widget-subtitle-text">
            {displayedWords.map((word, index) => (
              <span
                key={`${index}-${word}`}
                className="voice-widget-word"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {word}{' '}
              </span>
            ))}
            <span className="voice-widget-cursor"></span>
          </div>
        </div>
      )}

      {/* Voice mode - connected state or ending animation */}
      {chatMode === 'voice' && (status === 'connected' || isCallEnding) && (
        <div className={`voice-widget-active ${isCallEnding ? 'call-ending' : ''}`}>
          {!isCallEnding && (
            <div className={`voice-widget-live-label ${voiceState}`}>
              <span className="voice-widget-live-dot active"></span>
              <span>{voiceState === 'speaking' ? 'Speaking' : voiceState === 'listening' ? 'Listening' : 'Live'}</span>
            </div>
          )}
          <button
            className={`voice-widget-button voice-widget-live ${voiceState} ${isCallEnding ? 'ending' : ''}`}
            onClick={isCallEnding ? undefined : endConversation}
            aria-label="End call"
          >
            {voiceState === 'listening' ? (
              <div className="voice-widget-ear-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
                  <path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55.51.23 1.07.35 1.64.35 2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2zM7.64 2.64L6.22 1.22C4.23 3.21 3 5.96 3 9s1.23 5.79 3.22 7.78l1.41-1.41C6.01 13.74 5 11.49 5 9s1.01-4.74 2.64-6.36zM11.5 9c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5z"/>
                </svg>
              </div>
            ) : (
              <div className={`voice-widget-soundwave ${voiceState}`}>
                <div className="voice-widget-bar"></div>
                <div className="voice-widget-bar"></div>
                <div className="voice-widget-bar"></div>
                <div className="voice-widget-bar"></div>
                <div className="voice-widget-bar"></div>
              </div>
            )}
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

      {/* Text mode - minimized button when chat panel is open */}
      {chatMode === 'text' && showChatPanel && (
        <button
          className="voice-widget-button voice-widget-text-active"
          onClick={minimizeChat}
          aria-label="Minimize chat"
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
