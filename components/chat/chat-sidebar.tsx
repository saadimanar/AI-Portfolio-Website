"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Menu,
  Home,
  Laugh,
  BriefcaseBusiness,
  Layers,
  FileText,
  UserRoundSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Same questions from your first page
const questions = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects? What are you working on right now?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Resume: "Can I see your Resume?",
  Contact:
    'How can I reach you? What kind of project would make you say "yes" immediately?',
} as const;

// Same configuration from your first page
const questionConfig = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Projects", color: "#3E9858", icon: BriefcaseBusiness },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Resume", color: "#B95F9D", icon: FileText },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
] as const;

const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const router = useRouter();

  const goHome = () => {
    router.push("/");
    onToggle();
  };

  // Same navigation logic as your first page
  const goToChat = (query: string) => {
    window.location.href = `/chat?query=${encodeURIComponent(query)}`;
    onToggle(); // Close sidebar after navigation
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 h-10 w-10 rounded-lg border border-border bg-background/80 backdrop-blur-sm hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-background border-r border-border shadow-xl"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">M</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Manar's Portfolio
                  </h2>
                  <p className="text-xs text-muted-foreground">AI Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="p-4 space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Navigation
              </div>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}
                onClick={goHome}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer group border border-transparent hover:border-border/50 active:scale-95"
              >
                <div
                  className="p-2 rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: "#32969615" }}
                >
                  <Home
                    className="h-5 w-5"
                    style={{ color: "#329696" }}
                    strokeWidth={2}
                  />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground group-hover:text-foreground">
                    Home
                  </div>
                </div>
              </motion.button>
              {questionConfig.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 1) * 0.1 }}
                    onClick={() => goToChat(questions[item.key])}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer group border border-transparent hover:border-border/50 active:scale-95"
                  >
                    <div
                      className="p-2 rounded-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: item.color }}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground group-hover:text-foreground">
                        {item.key}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                Click any option to start a conversation
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;
