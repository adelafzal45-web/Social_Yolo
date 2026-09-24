import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

import { brandingConfig } from "@/config/branding.config";

export const metadata: Metadata = {
  title: "Social Yolo — AI Social Media Studio & Post Generator",
  description:
    "Promote your brand professionally. AI-powered flyer and social media post creator with automatic background removal, designer prompt expansion, and personalized RAG style learning.",
  keywords: [
    "AI Post Generator",
    "Social Media Design",
    "Flyer Creator",
    "Background Removal",
    "RAG Style Learning",
    "Social Yolo",
  ],
  icons: {
    icon: brandingConfig.favicon.default,
    shortcut: brandingConfig.favicon.default,
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BrandProvider } from "@/context/BrandContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FaviconManager } from "@/components/ui/FaviconManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${outfit.variable} scroll-smooth`}>
      <head>
        <meta name="google" content="notranslate" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var match = document.cookie.match(/(?:^|; )social_yolo_theme=([^;]*)/);
                  var saved = match ? decodeURIComponent(match[1]) : null;
                  var isDark = saved ? saved === 'dark' : false;
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 selection:bg-brand-500 selection:text-white min-h-screen flex flex-col transition-colors duration-200"
      >
        <ThemeProvider>
          <FaviconManager />
          <BrandProvider>
            <AuthProvider>
              <NotificationProvider>
                <AuthGuard>
                  {children}
                </AuthGuard>
              </NotificationProvider>
            </AuthProvider>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


