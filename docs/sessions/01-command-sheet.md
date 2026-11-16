# Session 1 command sheet

For attendees. Everything here is optional: you can follow the whole session with a browser and the two public URLs.

## In the browser (everyone)

Open DevTools (`Cmd-Option-I`), go to the **Network** tab, tick **Disable cache**, reload.

Find:

1. How many requests the page made.
2. The largest file, and its type.
3. One response header that differs between the two public URLs. Click a request, then **Headers**.

In the game, press `O` for the diagnostics overlay. The build ID is also shown top-right.

## On your own machine (optional)

Needs Node 20.19 or newer and git.

```bash
git clone https://github.com/gilad-hoshmand-sage/running-eng-forum.git
cd running-eng-forum
npm install
```

Dev server, at http://localhost:5173/:

```bash
npm run dev
```

Build, then look at what it produced:

```bash
npm run build
ls -lh apps/game/dist apps/game/dist/assets
```

Serve the build, at http://localhost:4173/:

```bash
npm run preview
```

Look at response headers without a browser:

```bash
curl -I http://localhost:4173/
curl -I http://localhost:4173/world.json
```

Two more servers over the same files:

```bash
npm run serve:python   # http://localhost:8081/
npm run serve:nginx    # http://localhost:8082/  (needs Docker)
```

## Try it

With `npm run dev` running, open `apps/game/public/world.json`, find the `buildingWall` material near the top, change its `color` and save. The browser reloads by itself.

To undo:

```bash
git checkout apps/game/public/world.json
```
