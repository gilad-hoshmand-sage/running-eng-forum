import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import wasm from 'vite-plugin-wasm';

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

/** Build identity: written to version.json and compiled into the bundle. */
function buildIdentity(isBuild: boolean) {
  const builtAt = new Date().toISOString();
  const commit = git('rev-parse HEAD') ?? 'unknown';
  const dirty = (git('status --porcelain') ?? '') !== '';
  const stamp = builtAt.replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const buildId = isBuild ? `${stamp}-${commit.slice(0, 7)}${dirty ? '-dirty' : ''}` : 'dev';
  return { buildId, commit, dirty, builtAt };
}

function versionPlugin(identity: ReturnType<typeof buildIdentity>): Plugin {
  const body = JSON.stringify(identity, null, 2) + '\n';
  return {
    name: 'game-version-json',
    // Dev server: serve version.json, and reload browsers when runtime data changes.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/version.json') return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(body);
      });
      server.watcher.on('change', (file) => {
        if (/[\\/]public[\\/](config|world)\.json$/.test(file)) {
          server.hot.send({ type: 'full-reload' });
        }
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: body });
    },
  };
}

export default defineConfig(({ command }) => {
  const identity = buildIdentity(command === 'build');
  return {
    // Relative URLs: the build works at a domain root and under any sub-path.
    base: './',
    define: {
      __BUILD_ID__: JSON.stringify(identity.buildId),
    },
    plugins: [wasm(), versionPlugin(identity)],
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d'],
    },
    build: {
      target: 'es2022',
      // Keep every image a separate, content-hashed file.
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'three', test: /node_modules[\\/]three[\\/]/ },
              { name: 'rapier', test: /node_modules[\\/]@dimforge[\\/]/ },
            ],
          },
        },
      },
    },
    preview: {
      port: 4173,
    },
  };
});
