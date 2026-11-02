import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type EnvironmentModuleNode } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    {
      name: "reload-react-hooks",
      apply: "serve",
      hotUpdate({ file, modules, timestamp }) {
        if (
          this.environment.config.consumer !== "client" ||
          !file.startsWith(`${this.environment.config.root}/src/hooks/`)
        )
          return;
        // Hook modules lack refresh signatures; preserving their state can crash React.
        const invalidated = new Set<EnvironmentModuleNode>();
        for (const module of modules) {
          this.environment.moduleGraph.invalidateModule(
            module,
            invalidated,
            timestamp,
            true,
          );
        }
        this.environment.hot.send({ type: "full-reload" });
        return [];
      },
    },
  ],
  // Avoid discovering these browser dependencies during a page refresh.
  optimizeDeps: { include: ["react-dom/client", "lucide-react"] },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  build: { target: "es2023" },
});
