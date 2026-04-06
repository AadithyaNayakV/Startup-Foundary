import { Providers } from "@/redux/provider";
import "./globals.css";

export const metadata = {
  title: "Foundry | Startup-Investor Platform",
  description: "Connect top founders with leading investors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}