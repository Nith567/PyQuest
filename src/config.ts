import { arbitrum } from "viem/chains";

/**
 * API Configuration
 */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin) || '',
} as const;

/**
 * Smart Contract Configuration
 */
export const contractConfig = {
  address: "0xe1063c2aaB3b0BD817e92b9E37901f41Ac297a6f" as `0x${string}`,
  chain: arbitrum,
} as const;

/**
 * PYUSD Token Configuration
 */
export const pyusdConfig = {
  address: "0x46850ad61c2b7d64d08c9c754f45254596696984" as `0x${string}`, // PYUSD on Arbitrum
  decimals: 6,
  symbol: "PYUSD",
} as const;

/**
 * NFT Metadata Configuration
 */
export const metadata = {
  name: "PyQuest - Farcaster Bounty Platform",
  description:
    "Post bounties, hunt tasks, and earn PYUSD rewards! PyQuest connects bounty posters with skilled hunters on Farcaster. Create bounties with PYUSD rewards, receive submissions as cast replies, and reward the best work.",
  imageUrl: "https://pyquest.vercel.app/pyquest-icon.png",
  creator: {
    name: "nith567.eth",
    fid: 382654,
    profileImageUrl: "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2FlXZh9fc.jpg",
  },
  chain: arbitrum,
  startsAt: null,
  endsAt: null,
  isMinting: false,
} as const;


/**
 * Farcaster Frame Embed Configuration
 */
export const embedConfig = {
  version: "next",
  imageUrl: "https://pyquest.vercel.app/pyquest-icon.png",
  button: {
    title: "Open PyQuest",
    action: {
      type: "launch_frame",
      name: "PyQuest",
      url: "https://pyquest.vercel.app",
    },
  },
} as const;

/**
 * Main App Configuration
 */
export const config = {
  ...metadata,
  embed: embedConfig,
  contract: contractConfig,
  pyusd: pyusdConfig,
} as const;
