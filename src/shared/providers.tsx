"use client";

import { SessionProvider } from "next-auth/react";
import { AiChatWidget } from "@/features/chat/components/ai-chat-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchWhenOffline={false}>
      {children}
      <AiChatWidget />
    </SessionProvider>
  );
}
