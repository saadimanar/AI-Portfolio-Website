"use client";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { toast } from 'sonner';

// Component imports
import ChatBottombar from "@/components/chat/chat-bottombar";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { SimplifiedChatView } from "@/components/chat/simple-chat-view";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";

// const MOTION_CONFIG = {
//   initial: { opacity: 0, y: 20 },
//   animate: { opacity: 1, y: 0 },
//   exit: { opacity: 0, y: 20 },
//   transition: {
//     duration: 0.3,
//     ease: "easeOut",
//   },
// };

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: 0.3,
    ease: "easeOut",
  },
} as const;

const CHAT_STORAGE_KEY = "portfolio-chat-messages";
const CLEAR_CHAT_ON_NEXT_VISIT_KEY = "clear_chat_on_next_visit";
/**
 * Last `?query=` we successfully appended in this tab. Used to tell:
 * - refresh with the same URL + existing history → do not append again
 * - new `?query=` (e.g. sidebar) → append even when localStorage has history
 */
const LAST_URL_QUERY_KEY = "portfolio_last_chat_url_query";

const Chat = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
    addToolResult,
    append,
  } = useChat({
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
        setIsTalking(true);
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.error("Failed to play video:", error);
          });
        }
      }
    },
    onFinish: () => {
      setLoadingSubmit(false);
      setIsTalking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    onError: (error) => {
      setLoadingSubmit(false);
      setIsTalking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      console.error("Chat error:", error.message, error.cause);
      // toast.error(`Error: ${error.message}`);
    },
    onToolCall: (tool) => {
      const toolName = tool.toolCall.toolName;
      console.log("Tool call:", toolName);
    },
  });

  const { currentAIMessage, latestUserMessage, hasActiveTool } = useMemo(() => {
    const latestAIMessageIndex = messages.findLastIndex(
      (m) => m.role === "assistant"
    );
    const latestUserMessageIndex = messages.findLastIndex(
      (m) => m.role === "user"
    );

    const result = {
      currentAIMessage:
        latestAIMessageIndex !== -1 ? messages[latestAIMessageIndex] : null,
      latestUserMessage:
        latestUserMessageIndex !== -1 ? messages[latestUserMessageIndex] : null,
      hasActiveTool: false,
    };

    if (result.currentAIMessage) {
      result.hasActiveTool =
        result.currentAIMessage.parts?.some(
          (part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation?.state === "result"
        ) || false;
    }

    if (latestAIMessageIndex < latestUserMessageIndex) {
      result.currentAIMessage = null;
    }

    return result;
  }, [messages]);

  const isToolInProgress = messages.some(
    (m) =>
      m.role === "assistant" &&
      m.parts?.some(
        (part) =>
          part.type === "tool-invocation" &&
          part.toolInvocation?.state !== "result"
      )
  );

  const submitQuery = useCallback(
    (query: string) => {
      if (!query.trim() || isToolInProgress) return;
      setLoadingSubmit(true);
      append({
        role: "user",
        content: query,
      });
    },
    [append, isToolInProgress]
  );

  const submitQueryRef = useRef(submitQuery);
  submitQueryRef.current = submitQuery;
  const setInputRef = useRef(setInput);
  setInputRef.current = setInput;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.pause();
    }
  }, []);

  /**
   * Apply `?query=` from the URL: restore runs in a separate effect; we defer with
   * `setTimeout(0)` so `setMessages(saved)` from localStorage does not race with `append`.
   */
  useEffect(() => {
    const q = initialQuery?.trim();
    if (!q) return;

    try {
      const lastApplied = sessionStorage.getItem(LAST_URL_QUERY_KEY);
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      let hasHistory = false;
      if (raw) {
        const saved = JSON.parse(raw);
        hasHistory = Array.isArray(saved) && saved.length > 0;
      }
      if (hasHistory && lastApplied === q) return;
    } catch {
      // fall through to schedule submit
    }

    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(LAST_URL_QUERY_KEY, q);
      } catch {
        // ignore
      }
      setInputRef.current("");
      submitQueryRef.current(q);
    }, 0);

    return () => clearTimeout(id);
    // Intentionally only `initialQuery`: `submitQuery` changes every time `isToolInProgress`
    // flips during streaming, which would re-run this effect in a loop and re-append forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs carry latest submitQuery/setInput
  }, [initialQuery]);

  useEffect(() => {
    if (videoRef.current) {
      if (isTalking) {
        videoRef.current.play().catch((error) => {
          console.error("Failed to play video:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isTalking]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingSubmit]);

  // On mount: if user came from another page (e.g. home), clear history for new session. Otherwise restore from localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(CLEAR_CHAT_ON_NEXT_VISIT_KEY)) {
        sessionStorage.removeItem(CLEAR_CHAT_ON_NEXT_VISIT_KEY);
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return;
      }
    } catch {
      // ignore
    }
    if (hasRestoredRef.current || messages.length > 0) return;
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as typeof messages;
      if (Array.isArray(saved) && saved.length > 0) {
        setMessages(saved);
        hasRestoredRef.current = true;
      }
    } catch (e) {
      console.error("Failed to restore chat history", e);
    }
  }, [messages.length, setMessages]);

  // Persist chat history to localStorage when messages change (and not streaming)
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages, isLoading]);

  //@ts-ignore
  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isToolInProgress) return;
    submitQuery(input);
    setInput("");
  };

  const handleStop = () => {
    stop();
    setLoadingSubmit(false);
    setIsTalking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Check if this is the initial empty state (no messages)
  const isEmptyState = messages.length === 0 && !loadingSubmit;

  // Calculate header height based on hasActiveTool
  const headerHeight = hasActiveTool ? 100 : 180;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="container mx-auto flex h-full max-w-3xl flex-col">
        {/* Scrollable Chat Content */}
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          <AnimatePresence mode="wait">
            {isEmptyState ? (
              <motion.div
                key="landing"
                className="flex min-h-full items-center justify-center"
                {...MOTION_CONFIG}
              >
                {/* <ChatLanding submitQuery={submitQuery} /> */}
              </motion.div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message) => {
                  if (message.role === "user") {
                    const text =
                      typeof message.content === "string"
                        ? message.content
                        : "";
                    return (
                      <motion.div
                        key={message.id}
                        {...MOTION_CONFIG}
                        className="flex justify-start px-4"
                      >
                        <ChatBubble
                          variant="sent"
                          className="self-start mx-0 flex-row-reverse"
                        >
                          <ChatBubbleMessage className="bg-muted/80 text-foreground border border-border rounded-lg rounded-bl-none">
                            {text}
                          </ChatBubbleMessage>
                        </ChatBubble>
                      </motion.div>
                    );
                  }
                  if (message.role === "assistant") {
                    const isLastAssistant = message.id === currentAIMessage?.id;
                    return (
                      <motion.div key={message.id} {...MOTION_CONFIG}>
                        <SimplifiedChatView
                          message={message}
                          isLoading={isLastAssistant && isLoading}
                          reload={reload}
                          addToolResult={addToolResult}
                        />
                      </motion.div>
                    );
                  }
                  return null;
                })}
                {loadingSubmit && (
                  <motion.div
                    key="loading"
                    {...MOTION_CONFIG}
                    className="px-4"
                  >
                    <ChatBubble variant="received">
                      <ChatBubbleMessage isLoading />
                    </ChatBubble>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Bottom Bar */}
        <div className="sticky bottom-0 bg-white px-2 pt-3 md:px-0 md:pb-4">
          <div className="relative flex flex-col items-center gap-3">
            {/* <HelperBoost submitQuery={submitQuery} setInput={setInput} /> */}
            <ChatBottombar
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={onSubmit}
              isLoading={isLoading}
              stop={handleStop}
              isToolInProgress={isToolInProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
