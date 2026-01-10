import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "TGT - Admin System",
  description: "Tiga Garis Terdepan Admin System",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
