/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGODB_URI: string
  readonly VITE_NEYNAR_API_KEY: string
  readonly VITE_GAME_PRIVATE_KEY: string
  readonly VITE_THIRDWEB_CLIENT_ID: string
  readonly VITE_THIRDWEB_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
