<div align="center">
<img alt="MPO" src="docs/assets/icon.png" />

  # Metroid Prime Origins
  ### Unofficial Nintendo Switch Homebrew Port

*A wrapper/port of the acclaimed [fan game by Lv.4 Games](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/) (GameMaker Studio).*

</div>

> [!IMPORTANT]
> This repository contains **only the Switch wrapper** - no game data and no GameMaker runner binary. You must supply those yourself.

## 💿 Installation

You need:

1. Your [Metroid Prime Origins v1.1.2 or later APK](https://www.reddit.com/r/Metroid/comments/1vhmcf8/metroid_prime_origins_new_fan_game_out_now/) (Latest Switch Supported version) **Hint:** Discord
2. This repo / [Switch Port Generator](https://bshurikan.github.io/mpo_nx/)

### Method S - Easy (web app, any OS)

1. Open the **Switch Port Generator** (button below).
2. Drop your **official Metroid Prime Origins Android APK v1.1.2**.
3. Click **Prepare SD** and download the generated zip file.
4. Extract → copy `mpo_nx/` → `sdmc:/switch/mpo_nx/`
5. Launch `mpo_nx.nro` with **full RAM** (hold **R**, or use a forwarder)

[![Open Switch Port Generator](https://img.shields.io/badge/Open_Switch_Port_Generator-f2b040?style=for-the-badge)](https://bshurikan.github.io/mpo_nx/)
<!--
---

<details>
<summary>Method A - Easy (Windows prep script) [Depricated]</summary>

> **Important:** from 1.1.2d onward use **[Switch Port Generator](https://bshurikan.github.io/mpo_nx/)**

> Same result as the web tool, using the release zip.

1. Extract **`mpo-switch-release.zip`**.
2. Double-click and run **`tools/Prepare SD Card.bat`**.
3. Select your **Metroid Prime Origins Android APK** when prompted.
4. Copy the generated **`sd_card/mpo_nx/`** folder to **`sdmc:/switch/mpo_nx/`** 

> If the script fails, use Method A (browser) or Method B.</details>

---

<details>
<summary>Method B - Moderate (Manual any OS) [Depricated]</summary>
   
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
6. Copy the finished **`mpo_nx/`** folder to **`sdmc:/switch/mpo_nx/`**.
</details>

---
-->
### Final layout:

```
sdmc:/switch/mpo_nx/
├── mpo_nx.nro
├── config.txt
├── gamecontrollerdb.txt
├── sdl2.txt
├── game.apk                 ← your Origins Android YYC APK (renamed)
├── libyoyo.so               ← from Switch Port Generator
└── assets/                  ← from APK assets/ (+ sdl2.txt overwrite)
    ├── game.droid           ← from Switch Port Generator
    ├── sdl2.txt
    └── ...
```

## 🎮 Controls

| Switch Input | Action |
|--------|--------|
| **D-pad / Left stick** | Move / menus |
| **Face buttons** | A accept/Morph ball, B cancel/Jump, X Missile, Y Beam |
| **L / R** | Free Aim / Aim Lock |
| **LT / RT** | Scan / Grapple Beam |
| **Minus (−)** | Map |
| **Plus (+)** | Menu / pause |
| **Right stick / L3** | Switch Beams |
| **L3 + R3** | **NX Options** menu |

<br>
<img width="700" alt="NX Options Menu" src="https://github.com/user-attachments/assets/cc7ba2a7-11c0-41e0-bc64-6a4019ee96b7" />

> [!TIP]
> Press **L3 + R3** to open **NX Options**. Toggle FPS / Aspect Ratio / Mods and more (changes written to `config.txt`).

## 🔧 Configuration

| Key | Default | Notes |
|-----|---------|-------|
| `show_fps` | `1` | On-screen FPS |
| `vsync` | `1` | Harmless |
| `docked_clocks` | `1` | Higher GPU in handheld when allowed |
| `aspect_ratio` | `1` | 0=Original 4:3 (letterboxed) 1=Stretched 16:9 (distorted) |
| `handheld_docked` | `1` | Force official docked 768 MHz while undocked |
| `menu_bg` / `menu_transparency` | Constellation / 0 | NX Options backdrop |
| `ship_teleport` | `1` | Landing Site ship as teleport destination |
| `teleport_order` | `1` | `0` discovery, `1` Organized (menu only) |
| `input_profile` | `1` | YYC / Input 10 |

## 🌡 Performance

As of v1.1.0 this port uses YYC APK (I had the pleasure of working directly with Lv.4 to release the Android version), this allows for 100% full speed except in some rooms with many sprites. It is 100% playable, enjoy! 

> [!NOTE]
> As of v1.1.2d performance has been significantly improved and maintains a solid 50-60fps for silky smooth gameplay in areas that used to have slow down like Tallon Canyon, Phendrana Shorelines, Fungal Hall B and Metroid Nursery. 

## 👾 Credits

- Wrapper based on the Android GameMaker loader pattern (How Many Dudes / fgsfds, Andy Nguyen) and [Castlevania ReVamped Switch](https://github.com/bshurikan/cvrevamped_nx)
- **Metroid Prime Origins** is by **Lv.4 Games**. Fan-game credits below are from in-game Extras → Credits. In-game also scrolls original *Metroid Prime* studio staff acknowledgments (not repeated here).

<br>
<table>
  <thead>
    <tr><th colspan="2" align="left">Metroid Prime Origins Original Credits</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Game &amp; level design</strong></td><td>Lv.4 WALL</td></tr>
    <tr><td><strong>Sprite art + tile art</strong></td><td>Zevroid</td></tr>
    <tr><td><strong>Sprite art</strong></td><td>Vectrex28</td></tr>
    <tr><td><strong>Tile art</strong></td><td>Sarkuvaria</td></tr>
    <tr><td><strong>Large pixel art</strong></td><td>Jacob Pavone</td></tr>
    <tr><td><strong>Pixel art</strong></td><td>Shmegleskimo · hansungkee · ChaosMiles07 · SmithyGCN · Chris2Balls · ansimuz · Knoble Persona · Chipmunk · Wandering Spider · Evert · gandalfhardcore · Tango311 · Kenney · Tom93 · Momeg · MurphMario · Hydorah · Hackmi</td></tr>
    <tr><td><strong>Logbook writing</strong></td><td>Ivan Perez · Lv.4 WALL · ChaosMiles07 · Zekeram12</td></tr>
    <tr><td><strong>Sound effect art</strong></td><td>Bran</td></tr>
    <tr><td><strong>Exclusive music</strong></td><td>Marcosrod314 · Loeder · Matias Sosa</td></tr>
    <tr><td><strong>Music contributions</strong></td><td>Loeder · Bran · CrazyWazy</td></tr>
    <tr><td><strong>Enemy design</strong></td><td>Lv.4 WALL · Zevroid</td></tr>
    <tr><td><strong>Alpha testing</strong></td><td>Max Morrone · Jack Beauchamp · Marilyn Hannan · Funmi Somoye · DJ Cameron · Alyse Wells · Mike Okhuereigbe · Abby May</td></tr>
    <tr><td><strong>Beta testing</strong></td><td>ChaosMiles07 · Ivan Perez · Jen Hiles · Jack Beauchamp · Abby May · Marilyn Hannan · Funmi Somoye · Max Morrone · Jordan Esperanza · CrazyWazy · Vectrex28 · Bran · Spriven · Nerdy Nester · Tenka · Dreamin' · Vacantshade · M3D · Zevroid</td></tr>
    <tr><td><strong>Tile placement</strong></td><td>Marilyn “Yaoi Lord” Hannan · Lv.4 WALL</td></tr>
    <tr><td><strong>Dependency analysis</strong></td><td>ChaosMiles07</td></tr>
    <tr><td><strong>Input migration</strong></td><td>bshurikan</td></tr>
    <tr><td><strong>Code assistance</strong></td><td>M3D · MagnaDev · Vacantshade · Scooterboot</td></tr>
    <tr><td><strong>Post-release testing</strong></td><td>PROUTJV · Zekeram12 · Greggy · treeroot · Ori · Kohiiiiro · Tolsyak · Templar · Mewlif · TripleRyGuy · YomarutoM12+ · Bokyubi · Rockman · Linkshot</td></tr>
    <tr><td><strong>Tools / libraries</strong></td><td>Pixelated Pope (Retro Palette Swapper) · Ronen Ness (Pixelator) · Juju Adams, Alynne Keith, and Friends (Input 10.3 &amp; Scribble 9.0)</td></tr>
    <tr><td><strong>Special thanks</strong></td><td>The Metroid Fan Mission Survivors · The VG Resource · Metroid2002 · MetConst · Metroid Wiki · Wikitroid</td></tr>
    <tr><td colspan="2" align="center"><em>METROID / METROID PRIME are property of Nintendo - Origins is a free fan-made tribute</em><br><strong>Produced by Lv.4 WALL · Presented by Lv.4 GAMES, 2026</strong></td></tr>
  </tbody>
</table>
