import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, loadEnv } from "vite";

function fcFrameMeta(): Plugin {
  return {
    name: "inject-fc-frame-meta",
    transformIndexHtml(html: string) {
      // Dynamically load config only when transforming HTML
      const { config } = require("./src/config");
      const embedJson = JSON.stringify(config.embed);
      const metaTag = `<meta name="fc:frame" content='${embedJson}'>`;
      return html.replace('</head>', `${metaTag}\n</head>`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
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
  };
});
