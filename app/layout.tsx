import type { Metadata } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.OPENROUTER_SITE_URL ??
  "https://open-chat.vercel.app";

const socialImage = "/og-hero.png";
const githubUrl = "https://github.com/dev-amanydv/open-chat";
const emailAddress = "ay.work07@gmail.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Open Chat",
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
    "Aman Yadav",
  ],
  authors: [{ name: "Aman Yadav", url: "https://github.com/dev-amanydv" }],
  creator: "Aman Yadav",
  publisher: "Open Chat",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png", sizes: "any" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Open Chat - Agentic Messaging and Meeting Automation",
    description:
      "Automate chats, summaries, scheduling, and follow-ups with specialized agents in one workspace.",
    siteName: "Open Chat",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Open Chat agent workspace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Chat - Agentic Messaging and Meeting Automation",
    description:
      "One workspace for chat automation, meeting booking, and multi-agent task execution.",
    creator: "@amanyadav",
    images: [socialImage],
  },
  other: {
    github: githubUrl,
    email: emailAddress,
    contact: emailAddress,
    developer: "Aman Yadav",
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
        <html
          lang="en"
          suppressHydrationWarning
          className={`${onest.variable} ${jetbrainsMono.variable}`}
        >
          <body className="antialiased">
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              <Analytics />
              <SpeedInsights />
              <Toaster position="top-center" />
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
