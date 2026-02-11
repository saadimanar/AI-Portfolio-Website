"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CLEAR_CHAT_ON_NEXT_VISIT_KEY = "clear_chat_on_next_visit";

/**
 * When the user is on any page other than /chat, set a flag so that when they
 * open the chat page we clear localStorage and start a new session.
 * This does not run on refresh of /chat (we stay on /chat), so history is preserved.
 */
export function ChatSessionClear() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/chat") {
      try {
        sessionStorage.setItem(CLEAR_CHAT_ON_NEXT_VISIT_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  return null;
}
