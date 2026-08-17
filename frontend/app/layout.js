import { Providers } from "@/redux/provider";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

export const metadata = {
  title: "Foundry | Startup-Investor Platform",
  description: "Connect top founders with leading investors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <Providers>
          <ToastProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}