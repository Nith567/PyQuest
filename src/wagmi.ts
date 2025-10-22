import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { arbitrum } from "wagmi/chains";

// Create a wagmi config
export const config = createConfig({
  chains: [arbitrum],
  connectors: [farcasterFrame()],
  transports: {
    [arbitrum.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
