"use client";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from 'sonner';

// Component imports
import ChatBottombar from "@/components/chat/chat-bottombar";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { SimplifiedChatView } from "@/components/chat/simple-chat-view";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";

/** Extract plain text content from an AI SDK message for DB storage */
function getMessageContent(msg: Message): string {
  if (typeof msg.content === "string") return msg.content;
  if (msg.parts?.length) {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

const CHAT_SAVE_API = "/api/chat/save";

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

const Chat = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const [autoSubmitted, setAutoSubmitted] = useState(false);
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

  messagesRef.current = messages;

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

  //@ts-ignore
  const submitQuery = (query) => {
    if (!query.trim() || isToolInProgress) return;
    setLoadingSubmit(true);
    append({
      role: "user",
      content: query,
    });
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.pause();
    }

    if (initialQuery && !autoSubmitted) {
      setAutoSubmitted(true);
      setInput("");
      // Don't re-submit the query if we have saved history (e.g. user refreshed)
      try {
        const raw = typeof window !== "undefined" && localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length > 0) return;
        }
      } catch {
        // ignore
      }
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted]);

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

  // Restore chat history from localStorage on mount
  useEffect(() => {
    if (hasRestoredRef.current || messages.length > 0) return;
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(CHAT_STORAGE_KEY);
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

  // Save full conversation to DB when session ends (unmount or page close)
  useEffect(() => {
    const saveSessionToDb = (msgs: Message[]) => {
      const records = msgs
        .map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: getMessageContent(m),
        }))
        .filter((r) => r.content.trim().length > 0);
      if (records.length === 0) return;
      const body = JSON.stringify({ messages: records });
      // Clear local history so the next conversation starts fresh
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch {
        // ignore
      }
      // Use keepalive so the request can complete when the page is closing
      fetch(CHAT_SAVE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch((err) => console.error("Failed to save chat session to DB", err));
    };

    const onPageHide = () => saveSessionToDb(messagesRef.current);

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      saveSessionToDb(messagesRef.current);
    };
  }, []);

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
