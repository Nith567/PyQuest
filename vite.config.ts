import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

function fcFrameMeta(): Plugin {
  return {
    name: "inject-fc-frame-meta",
    transformIndexHtml(html: string) {
      // Static embed config - will be used at build time
      const embedConfig = {
        version: "next",
        imageUrl: "/pyquest-icon.png", // Relative path for production
        button: {
          title: "Open PyQuest",
          action: {
            type: "launch_frame",
            name: "PyQuest",
            url: process.env.VITE_DEPLOY_URL || "https://pyquest.vercel.app",
          },
        },
      };
      
      const embedJson = JSON.stringify(embedConfig);
      const metaTag = `<meta name="fc:frame" content='${embedJson}'>`;
      return html.replace('</head>', `${metaTag}\n</head>`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), fcFrameMeta()],
  optimizeDeps: {
    exclude: [
      "@rhinestone/module-sdk",
      "@metamask/delegation-toolkit"
    ]
  },
  build: {
    rollupOptions: {
      external: [
        "@rhinestone/module-sdk",
        "@metamask/delegation-toolkit"
      ]
    }
  },
  server: {
    allowedHosts: true,
  },
});
