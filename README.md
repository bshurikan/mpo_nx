<div align="center"><img width="686" height="386" alt="image" src="https://github.com/user-attachments/assets/efcb91f0-42bf-4cc6-89c8-1b5d99ba2b20" />
</div>

# Metroid Prime Origins - Nintendo Switch Port

Unofficial homebrew port of **[Metroid Prime Origins](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/)** Fan Game (Lv.4 Games, GameMaker Studio 2 YYC) for modded Nintendo Switch.

This repository contains **only the Switch wrapper** - no game data and no GameMaker runner binary. You must supply those yourself.

## Quick start (Windows)

1. Download Latest **[mpo-switch-release.zip](https://github.com/bshurikan/mpo_nx/releases)** 
2. Extract the zip.
3. Have ready:
   - Your **[Metroid Prime Origins 1.5 (or later) APK](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/) Hint: Discord**    
4. Double-click **`tools/Prepare SD Card YYC.bat`**.
5. Select the **Origins APK**.
6. Copy the generated **`sd_card/mpo_nx/`** folder to your SD card as **`switch/mpo_nx/`**.
7. Launch **`mpo_nx.nro`** with **full RAM** (hold **R** while opening a title, or use a forwarder).

## SD card layout

```
sdmc:/switch/mpo_nx/
  mpo_nx.nro              ← wrapper (from release)
  config.txt              ← wrapper
  sdl2.txt                ← wrapper
  gamecontrollerdb.txt    ← wrapper
  game.apk                ← built by prep tool from your Origins APK
  libyoyo.so              ← from Origins APK
  assets/                 ← from your Origins APK
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

As of v1.1.0 this port uses YYC APK (I had the pleasure of working directly with Lv.4 to release the Android version), this allows for full performance 100% full speed except in some rooms with many sprites. It is 100% playable, enjoy! 

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
- Compatible VM runner sourced from Castlevania ReVamped Android (bytecode 17).
