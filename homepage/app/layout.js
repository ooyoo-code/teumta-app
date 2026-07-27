import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata = {
  title: "틈타 - 틈만 나면, 틈타!",
  description: "비는 시간에 AI가 딱 맞는 알바를 찾아드려요. 틈타 실시간 AI 매칭.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
