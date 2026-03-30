import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umbra Admin Dashboard",
  description: "Manage soulbound credentials for your organization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
