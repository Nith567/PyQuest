import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the client with your clientId
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// NOTE: gameAccount removed - private keys should NEVER be in browser code
// Use backend API routes for any transactions that need private keys

// Connect to your token contract on Arbitrum
export const contract = getContract({
  client,
  chain: defineChain(42161), // Arbitrum chain ID
  address: "0xA61b74B6F09e709C319Cb44B144d38530aB12879",
});