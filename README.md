<div align="center"><img width="256" height="256" alt="G" src="https://github.com/user-attachments/assets/b7fd3544-5a0b-4818-ad73-82d511c290ad" />
</div>

# Metroid Prime Origins - Nintendo Switch Port

Unofficial homebrew port of **[Metroid Prime Origins](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/)** Fan Game (Lv.4 Games, GameMaker Studio 2 YYC) for modded Nintendo Switch.

This repository contains **only the Switch wrapper** - no game data and no GameMaker runner binary. You must supply those yourself.

## Installation

You need:

1. Your [Metroid Prime Origins v1.1.2 APK](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/) (Latest Switch Supported version) **Hint:** Discord

2. This repo / [Switch Port Generator](https://bshurikan.github.io/mpo_nx/) tool **or** a release zip 

Launch **`mpo_nx.nro`** with **full RAM** (hold **R**, or use a forwarder).
   
---

### NEW Method A - Super Easy (Universal web app, any OS) - recommended

Prepares Switch port and patches QOL mods automatically. Nothing is uploaded; prep runs on your device.

1. Open **[Switch Port Generator](https://bshurikan.github.io/mpo_nx/)**
2. Drop your **Origins 1.1.2+ APK** and click **Prepare SD**
3. Extract the zip and copy **`mpo_nx/`** to **`sdmc:/switch/mpo_nx/`**
4. Launch with full RAM

### OLD Method A - Easy (Windows prep script)

Same result as the web tool, using the release zip.

1. Extract **`mpo-switch-release.zip`**.
2. Double-click and run **`tools/Prepare SD Card.bat`**.
3. Select your **Metroid Prime Origins Android APK** when prompted.
4. Copy the generated **`sd_card/mpo_nx/`** folder to **`switch/mpo_nx/`** on your SD card. 

> If the script fails, use Method A (browser) or Method B.

---

### Method B - Moderate (Manual procedure, any OS)
> **Important:** Manual installs do **not** apply the QOL mods. Prefer Method A NEW or OLD so `libyoyo.so` gets Ship teleport and Teleport order. Without the patch, the game still runs; just no mods.

1. Extract **`mpo-switch-release.zip`**. You should have a **`mpo_nx/`** folder with:
   - `mpo_nx.nro`
   - `config.txt`
   - `gamecontrollerdb.txt`
   - `sdl2.txt`
2. Copy **Origins Android YYC APK** into **`mpo_nx/`** and rename to **`game.apk`**.
3. Open **`game.apk`** with any zip tool (7-Zip, WinRAR, macOS Archive Utility, etc.) and extract:
   - **`lib/arm64-v8a/libyoyo.so`** → **`mpo_nx/libyoyo.so`**
   - The entire **`assets/`** folder → **`mpo_nx/assets/`**
4. Copy **`sdl2.txt`** from the release folder into **`mpo_nx/assets/sdl2.txt`** as well (overwrite if the APK already has one). This helps Switch gamepad mapping on YYC.
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

<img width="700" alt="image" src="https://github.com/user-attachments/assets/aeecc4c2-65f7-4eaf-84cd-c088171c2af5" />

## Configuration (`config.txt`)

Editable on PC or via **L3+R3** NX Options (saves on close). Resolution needs a restart.

| Key | Default | Notes |
|-----|---------|-------|
| `show_fps` | `1` | On-screen FPS |
| `vsync` | `0` | Keep off |
| `docked_clocks` | `1` | Higher GPU in handheld when allowed |
| `handheld_docked` | `0` | Force official docked 768 MHz while undocked |
| `menu_bg` / `menu_transparency` | Drift / 15 | NX Options backdrop |
| `ship_teleport` | `0` | Landing Site ship as teleport destination |
| `teleport_order` | `0` | `0` discovery, `1` Organized (menu only) |
| `input_profile` | `1` | YYC / Input 10 |

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
