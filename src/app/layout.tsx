import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileHeader } from "@/components/navigation";
import { getSession } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sai Balaji Inventory",
  description: "Internal Inventory & Sales System",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  themeColor: "#2563eb",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sai Balaji",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

import PWARegister from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-mesh text-gray-900 flex flex-col md:flex-row h-screen overflow-hidden`}>
        <ToastProvider>
          <PWARegister />
          <MobileHeader role={role} />

          <Sidebar role={role} />

          <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
            {children}
          </main>

          <Sidebar isMobile role={role} />
        </ToastProvider>
      </body>
    </html>
  );
}
