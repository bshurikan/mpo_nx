<div align="center"><img width="256" height="256" alt="mpo_icon_256" src="https://github.com/user-attachments/assets/9a0a7c79-5328-42c8-823e-68a8d28f5f03" /></div>

# Metroid Prime Origins - Nintendo Switch Port

Unofficial homebrew port of **Metroid Prime Origins** (Lv.4 Games, GameMaker Studio 2 VM) for modded Nintendo Switch.

This repository contains **only the Switch wrapper** - no game data and no GameMaker runner binary. You must supply those yourself.

## Quick start (Windows)

1. Download **mpo-switch-release.zip** 
2. Extract the zip.
3. Have ready:
   - Your **Metroid Prime Origins 1.0.1 Windows** folder (must include `data.win`)
   - A **Castlevania ReVamped** Android APK that includes ARM64 `libyoyo.so` (v0.1.16 VM is the known-good donor; ReVamped’s *game* is open source, the runner binary is still YoYo’s)
4. Double-click **`tools/Prepare SD Card.bat`**.
5. Select the **Origins Windows folder**, then the **Castlevania Android APK**.
6. Copy the generated **`sd_card/mpo_nx/`** folder to your SD card as **`switch/mpo_nx/`**.
7. Launch **`mpo_nx.nro`** with **full RAM** (hold **R** while opening a title, or use a forwarder).

## SD card layout

```
sdmc:/switch/mpo_nx/
  mpo_nx.nro              ← wrapper (from release)
  config.txt              ← wrapper
  sdl2.txt                ← wrapper
  gamecontrollerdb.txt    ← wrapper
  game.apk                ← built by prep tool from your Origins files
  libyoyo.so              ← from your Castlevania donor APK
  assets/                 ← from your Origins files
    game.droid
    BGM/
    ...
```

## Controls

- Face buttons mapped for Origins (A=accept B=cancel, etc.)
- D-pad + left stick for movement/menus
- ZL/ZR = scan / grapple analog

## Configuration (`config.txt`)

| Key | Default | Notes |
|---|---|---|
| `vsync` | `0` | Keep off - vsync locks gameplay to ~30 fps/50% speed |
| `show_fps` | `0` | Overlay off by default |
| `docked_clocks` | `1` | Max allowed GPU in handheld |
| `screen_width/height` | `-1` | Auto (720p handheld, 1080p docked) |

## Performance

Currently this port uses VM as there is no source code or YYC available (please let me know if this changes), unfortunately this caps performance at ~75% of PC movement speed and occasional hitches. It is 100% playable but not the definitive way to enjoy Origins (PC, Steam deck or similar recommended).

## Building from source

Requires [devkitPro](https://devkitpro.org/). See [BUILD.md](BUILD.md).

```bash
pacman -S --needed switch-dev switch-sdl2 switch-mesa switch-libdrm_nouveau switch-freetype switch-libpng switch-ffmpeg
make
```

Produces `mpo_nx.nro`.

## Credits

- Wrapper based on the Android GameMaker loader pattern (How Many Dudes / fgsfds, Andy Nguyen).
- Metroid Prime Origins by Lv.4 Games (fan project). Not affiliated.
- Compatible VM runner sourced by the user from Castlevania ReVamped Android (bytecode 17).
