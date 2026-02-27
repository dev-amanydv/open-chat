import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.OPENROUTER_SITE_URL ??
  "https://open-chat.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Open Chat - Agentic Messaging and Meeting Automation",
    template: "%s | Open Chat",
  },
  description:
    "Open Chat is an agent-first communication workspace where ChatMind, MeetingMind, and MasterMind automate messaging, scheduling, and multi-step workflows.",
  keywords: [
    "Open Chat",
    "agentic chat",
    "AI chat automation",
    "meeting scheduling assistant",
    "chat workflow automation",
    "ChatMind",
    "MeetingMind",
    "MasterMind",
  ],
  authors: [{ name: "Aman Yadav" }],
  creator: "Aman Yadav",
  publisher: "Open Chat",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Open Chat - Agentic Messaging and Meeting Automation",
    description:
      "Automate chats, summaries, scheduling, and follow-ups with specialized agents in one workspace.",
    siteName: "Open Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Chat - Agentic Messaging and Meeting Automation",
    description:
      "One workspace for chat automation, meeting booking, and multi-agent task execution.",
    creator: "@amanyadav",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body className="antialiased">
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-center" />
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
