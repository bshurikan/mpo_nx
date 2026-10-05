# Metroid Prime Origins NX — web Prepare SD

Browser tool that builds a Switch SD folder from your **official Metroid Prime Origins Android YYC APK v1.1.2**. Same role as the old Windows prep scripts — no uploads, runs locally in Chrome / Firefox / Edge.

## What it does (v1.1.2d)

1. You drop the **stock official 1.1.2** APK (verified by `libyoyo.so` + `game.droid` hashes).
2. The tool overlays a small hosted **update pack** (`libyoyo.so` + `game.droid`) that matches the personal enjoyment YYC build:
   - Invisible / Nursery / beam / weather perf culls
   - **GML ship teleport + teleport sorting** (reads `config.txt` — **no binary stubs**)
3. Everything else (BGM, most assets) comes from **your** APK.
4. You get `mpo_nx.zip` → copy to `sdmc:/switch/mpo_nx/`.

This site is the **only** public update path (not GitHub Releases Method A/B or 1.1.2c-style SO patches).

## Use it

1. Open the GitHub Pages site (or serve this folder locally).
2. Drop your **official** Origins **1.1.2** APK.
3. Click **Prepare SD** and wait for the zip.
4. Extract → copy `mpo_nx/` to `sdmc:/switch/mpo_nx/`.
5. Launch `mpo_nx.nro` with **full RAM** (hold **R**).
6. **L3+R3** → NX Options (Ship teleport, Teleport sorting, Aspect Ratio, etc.). Fresh `config.txt` is fine — tweak in-menu.

## Local preview

```bash
cd mpo-origins-nx
npx --yes serve -p 5173
```

Then open `http://localhost:5173`.

## Kit / update pack

| Path | Source |
|------|--------|
| `kit/mpo_nx.nro` | rebuild from `mpo-switch` |
| `kit/config.txt` | defaults (incl. GML teleport keys + aspect_ratio) |
| `kit/sdl2.txt` / `sdl2_yyc_prepend.txt` | release |
| `kit/gamecontrollerdb.txt` | release |
| `kit/update/1.1.2d/libyoyo.so` | from your YYC export APK |
| `kit/update/1.1.2d/game.droid` | same export |
| `kit/update/1.1.2d/manifest.json` | official + pack SHA-256 gates |

Refresh the update pack after a new GMS export: double-click
`tools\Rebuild Update Pack.bat` — it opens a file picker for your export APK.

Or from a shell:

```powershell
powershell -NoProfile -File .\tools\build_update_pack.ps1 -Gui
# or: -OriginsApk "E:\path\to\your-export.apk"
```

(`-OfficialApk` defaults to the stock 1.1.2 on Desktop/Switch Ports — used only for hash gates, not shipped.)

Legacy `kit/patches/*.json` stub patches are **unused** by Prepare SD.

## Notes

- Desktop Chrome / Firefox / Edge recommended (large APK + ~34 MB runner download).
- Fan project — not affiliated with Nintendo, Lv.4 Games, or YoYo Games.
- UI shell adapted from [Boot Toaster NX](https://bshurikan.github.io/boot-toaster-nx/).
- This repo does **not** redistribute the full Origins APK or audio; only the small update overlay + wrapper kit.

## License

Wrapper kit / site shell: see [LICENSE](LICENSE) and the mpo_nx repo. Game APK, sprites, and sounds remain with their respective owners.
