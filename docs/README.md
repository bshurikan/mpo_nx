# Metroid Prime Origins NX — web Prepare SD

Browser tool that builds a Switch SD folder from your **Metroid Prime Origins Android YYC APK** (v1.1.2+). Same job as `tools/Prepare SD Card.bat` in the [mpo_nx](https://github.com/bshurikan/mpo_nx) release — no Windows required, nothing uploaded.

## Use it

1. Open the GitHub Pages site (or serve this folder locally).
2. Drop your Origins **1.1.2+** APK.
3. Click **Prepare SD** and wait for the zip.
4. Extract → copy `mpo_nx/` to `sdmc:/switch/mpo_nx/`.
5. Launch `mpo_nx.nro` with **full RAM** (hold **R**).

The zip includes the wrapper NRO, config, patched `libyoyo.so` (Ship teleport / Teleport order), `assets/`, and `game.apk`.

## Local preview

```bash
cd mpo-origins-nx
npx --yes serve -p 5173
```

Then open `http://localhost:5173`.

## Kit updates

When you ship a new wrapper build, refresh:

| Path | Source |
|------|--------|
| `kit/mpo_nx.nro` | release / rebuild |
| `kit/config.txt` | release |
| `kit/sdl2.txt` / `sdl2_yyc_prepend.txt` | release |
| `kit/gamecontrollerdb.txt` | release |
| `kit/patches/ship_teleport_yyc_1.1.2.json` | `mpo-switch/patches/` |

UI Metroid frames/SFX come from Origins (`spr_metroid`, `sndMetroid1`, `snd_samus_scan`, `sndLogbook`).

## Notes

- Desktop Chrome / Firefox / Edge recommended (large APK → needs RAM).
- Fan project — not affiliated with Nintendo, Lv.4 Games, or YoYo Games.
- UI shell adapted from [Boot Toaster NX](https://bshurikan.github.io/boot-toaster-nx/).

## License

Wrapper kit / site shell: see [LICENSE](LICENSE) and the mpo_nx repo. Game APK, sprites, and sounds remain with their respective owners; this tool does not redistribute the APK.
