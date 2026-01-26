import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bufunfa - Privacy-First Expense Manager",
  description: "Self-hosted expense manager with AI-powered categorization",
  icons: {
    icon: "/bufunfa.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Auth0Provider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
              {children}
            </main>
          </SidebarProvider>
          <Toaster />
        </Auth0Provider>
      </body>
    </html>
  );
}
