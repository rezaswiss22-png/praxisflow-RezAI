import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PilotBanner } from "@/components/ui/PilotBanner";
import { TrpcProvider } from "@/lib/trpc/Provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PraxisFlow – Pilot",
  description: "Praxis-Workflow-Plattform (Pilot, ausschliesslich synthetische Testdaten)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>
        <PilotBanner />
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
