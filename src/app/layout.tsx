import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/providers";
import { getViewMode } from "@/shared/lib/view-mode-server";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "니혼 플래너 - 일본 여행 플래너",
  description: "도쿄, 교토, 오사카, 삿포로 맞춤 일본 여행 일정 플래너",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff4757",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewMode = await getViewMode();

  return (
    <html lang="ko" data-view-mode={viewMode} className={`${notoSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
