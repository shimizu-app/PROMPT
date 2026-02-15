import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROMPT REFINER - プロンプトの限界を、超えろ。",
  description:
    "14ルールエンジン搭載のプロンプトエンジニアリングシステム。Claude APIで最強のプロンプトを生成。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
