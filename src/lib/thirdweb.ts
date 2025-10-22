import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";

// Create the client with your clientId
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// Create account from private key for server-side transactions
export const gameAccount = privateKeyToAccount({
  client,
  privateKey: import.meta.env.VITE_GAME_PRIVATE_KEY,
});

// Connect to your token contract on Arbitrum
export const contract = getContract({
  client,
  chain: defineChain(42161), // Arbitrum chain ID
  address: "0xA61b74B6F09e709C319Cb44B144d38530aB12879",
});