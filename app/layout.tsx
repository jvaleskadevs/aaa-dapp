"use client";
import { WagmiConfig, createConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import Navbar from "@/components/homeComponent/navigation/navbar";
import Footer from "@/components/homeComponent/navigation/footer";

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY, // or infuraId
    walletConnectProjectId: "demo",
    
    chains: [polygonMumbai],

    // Required
    appName: "Alchemy Account Abstraction dapp",

    // Optional
    appDescription: "Alchemy Account Abstraction dapp is a demo app showing how to create custom smart wallets leveraging the Alchemy aa-sdk",
    //appUrl: "https://example.eth", // your app's url
    //appIcon: "https://family.co/logo.png", // your app's logo,no bigger than 1024x1024px (max. 1MB)
  })
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <WagmiConfig config={config}>
        <ConnectKitProvider mode="dark">
          <body>
            <div id="root" style={{ display: "flex", flexDirection: "column", minHeight: "105vh" }}>
              <Navbar />
              <div style={{flexGrow: 1}}>{children}</div>
              <Footer />
            </div>
          </body>
        </ConnectKitProvider>
      </WagmiConfig>
    </html>
  );
}
