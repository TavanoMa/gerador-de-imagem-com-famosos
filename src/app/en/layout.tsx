import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Celebrity Photo Generator - Your Photo with Famous People",
  description: "Create realistic photos next to your favorite celebrities using artificial intelligence. Generate and share amazing images with famous people.",
};

export default function EnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
