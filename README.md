<div align="center"><img width="686" height="386" alt="image" src="https://github.com/user-attachments/assets/efcb91f0-42bf-4cc6-89c8-1b5d99ba2b20" />
</div>

# Metroid Prime Origins - Nintendo Switch Port

Unofficial homebrew port of **[Metroid Prime Origins](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/)** Fan Game (Lv.4 Games, GameMaker Studio 2 YYC) for modded Nintendo Switch.

This repository contains **only the Switch wrapper** - no game data and no GameMaker runner binary. You must supply those yourself.

## Installation

You need:

1. **`mpo-switch-release.zip`** (or this repo) from [GitHub Releases](https://github.com/bshurikan/mpo_nx/releases) — wrapper + config + tools  
2. Your [Metroid Prime Origins v1.1.1 APK](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/) (Switch Supported version) Hint: Discord
   
**Important:** Lv.4 revised the input system in v1.1.2 and dropped support for switch - inputs will be broken! So stick with v1.1.1 until this is resolved. 

---

### Method A - Automatic (Windows prep script)

Best if you are on Windows and the script runs successfully.

1. Extract **`mpo-switch-release.zip`**.
2. Double-click **`tools/Prepare SD Card.bat`**.
3. Select your **Metroid Prime Origins Android APK** when prompted.
4. Copy the generated **`sd_card/mpo_nx/`** folder to your SD card as **`switch/mpo_nx/`**.

> If Method A doesn't work for you use Method B instead.

---

### Method B - Manual (any OS)

1. Extract **`mpo-switch-release.zip`**. You should have an **`mpo_nx/`** folder with at least:
   - `mpo_nx.nro`
   - `config.txt`
   - `gamecontrollerdb.txt`
   - `sdl2.txt`
2. Copy / rename your **Origins Android YYC APK** into it as **`game.apk`**.
3. Open **`game.apk`** with any zip tool (7-Zip, WinRAR, macOS Archive Utility, etc.) and extract:
   - **`lib/arm64-v8a/libyoyo.so`** → place as **`mpo_nx/libyoyo.so`**
   - The entire **`assets/`** folder → place as **`mpo_nx/assets/`**
4. Copy **`sdl2.txt`** from the release / `mpo_nx` folder into **`mpo_nx/assets/sdl2.txt`** as well (overwrite if the APK already has one). This helps Switch gamepad mapping on YYC.
5. Confirm **`config.txt`** has **`input_profile 1`** (required for YYC / Input 10; wrapper default).
6. Copy the finished **`mpo_nx/`** folder to your SD card as **`switch/mpo_nx/`**.

Final layout:

```
sdmc:/switch/mpo_nx/
├── mpo_nx.nro
├── config.txt
├── gamecontrollerdb.txt
├── sdl2.txt
├── game.apk                 ← your Origins Android YYC APK (renamed)
├── libyoyo.so               ← from APK lib/arm64-v8a/
└── assets/                  ← from APK assets/ (+ sdl2.txt overwrite)
    ├── game.droid
    ├── sdl2.txt
    └── ...
```

## Controls

| Switch | Action |
|--------|--------|
| D-pad / Left stick | Move / menus |
| Face buttons | Origins defaults (A accept/jump, etc.) |
| **ZL / ZR** | Scan / Grapple |
| **Minus (−)** | Map |
| **Plus (+)** | Menu / pause |
| **L3 + R3** | **NX Options** menu |

<img width="800" alt="Metroid_Prime_Origins_20260910_030703_00" src="https://github.com/user-attachments/assets/857b776c-eac2-4aa5-be71-d5de702cb2b3" />

## Configuration (`config.txt`)

| Key | Default | Notes |
|-----|---------|-------|
| `show_fps` | `1` | On-screen FPS counter |
| `vsync` | `0` | Keep off — vsync can lock pacing ~30 fps |
| `docked_clocks` | `1` | Higher GPU in handheld when Horizon allows (~460; 768 needs sys-clk) |
| `screen_width/height` | `-1` | Auto (720p handheld, 1080p docked) |
| `input_profile` | `1` | YYC / Input 10 (forced) |

In-game: press **L3 + R3** to open **NX Options**. Toggle FPS / VSync / clocks / resolution — changes write to `config.txt`.

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
