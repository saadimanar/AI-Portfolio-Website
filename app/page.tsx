"use client";

import FluidCursor from "@/components/FluidCursor";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import InfoDialog from "@/components/InfoDialog";
import {
  ArrowRight,
  BriefcaseBusiness,
  Laugh,
  Layers,
  UserRoundSearch,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Variants } from "framer-motion";

/* ---------- quick-question data ---------- */
const questions = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Resume: "Can I see your Resume?",
  Contact:
    'How can I reach you?',
} as const;

const questionConfig = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Projects", color: "#3E9858", icon: BriefcaseBusiness },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Resume", color: "#B95F9D", icon: FileText },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
] as const;

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // need to implement
  // const goToChat = (query: string) => {};
  const goToChat = (query: string) =>
    router.push(`/chat?query=${encodeURIComponent(query)}`);

  /* hero animations (unchanged) */
  // const topElementVariants = {
  //   hidden: { opacity: 0, y: -60 },
  //   visible: {
  //     opacity: 1,
  //     y: 0,
  //     transition: { type: "ease", duration: 0.8 },
  //   },
  // };

  const topElementVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring", // ✅ specific known string literal
        duration: 1.0,
      },
    },
  };
  const bottomElementVariants: Variants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", duration: 0.8, delay: 0.2 },
    },
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-10 md:pb-20">
      {/* header */}
      <InfoDialog />
      <motion.div
        className="z-1 mb-8 flex flex-col items-center text-center md:mb-12 mt-24 md:mt-4"
        variants={topElementVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-secondary-foreground mt-1 text-xl font-semibold md:text-2xl">
          Hey, I'm Manar 👋
        </h2>
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
          AI portfolio
        </h1>
      </motion.div>

      {/* input + quick buttons */}
      <motion.div
        variants={bottomElementVariants}
        initial="hidden"
        animate="visible"
        className="z-10 mt-4 flex w-full flex-col items-center justify-center md:px-0"
      >
        {/* free-form question */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) goToChat(input.trim());
          }}
          className="relative w-full max-w-lg"
        >
          <div className="mx-auto flex items-center rounded-full border border-neutral-200 bg-white/30 py-2.5 pr-2 pl-6 backdrop-blur-lg transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="w-full border-none bg-transparent text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Submit question"
              className="flex items-center justify-center rounded-full bg-black p-2.5 text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* quick-question grid */}
        <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {questionConfig.map(({ key, color, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => goToChat(questions[key])}
              variant="outline"
              className="shadow-none border-border hover:bg-border/30 aspect-square w-full cursor-pointer rounded-2xl border bg-white/30 py-8 backdrop-blur-lg active:scale-95 md:p-10"
            >
              <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-700">
                <Icon size={22} strokeWidth={2} color={color} />
                <span className="text-xs font-medium sm:text-sm">{key}</span>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
      <FluidCursor />
    </div>
  );
}
