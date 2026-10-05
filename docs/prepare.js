import { unzipSync } from "./vendor/fflate.esm.js";
import { buildZip } from "./zip.js";

/** Public 1.1.2d: official APK assets + hosted YYC runner/game.droid (no binary stubs). */
const UPDATE_VERSION = "1.1.2d";

/**
 * Job-status lines go to the typewriter console (app.js). Keep dwell low —
 * typing already paces them; a long dwell just stalls the zip.
 */
export const STATUS_DWELL_MS = 0;

const KIT = {
  nro: "./kit/mpo_nx.nro",
  config: "./kit/config.txt",
  sdl2: "./kit/sdl2.txt",
  controller: "./kit/gamecontrollerdb.txt",
  prepend: "./kit/sdl2_yyc_prepend.txt",
  updateManifest: `./kit/update/${UPDATE_VERSION}/manifest.json`,
  /* Hosted as zip — GitHub rejects bare ~34MB libyoyo.so; fflate unpacks in-browser. */
  updateLibZip: `./kit/update/${UPDATE_VERSION}/libyoyo.so.zip`,
  updateDroid: `./kit/update/${UPDATE_VERSION}/game.droid`,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tick() {
  return sleep(0);
}

/** Progress reporter with minimum on-screen time so lines are readable. */
function makeReporter(onProgress) {
  let lastShown = 0;
  return async (msg, pct, { dwell = true } = {}) => {
    if (dwell && lastShown) {
      const wait = STATUS_DWELL_MS - (performance.now() - lastShown);
      if (wait > 0) await sleep(wait);
    }
    if (onProgress) onProgress(msg, pct);
    lastShown = performance.now();
  };
}

async function fetchBytes(url, label, onProgress) {
  if (onProgress) onProgress(`${label}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${label} (${res.status}).`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status}).`);
  return res.text();
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ensureConfigDefaults(configText) {
  const lines = configText.replace(/\r\n/g, "\n").split("\n");
  const keys = {
    input_profile: "1",
  };
  const seen = {};
  const out = lines.map((line) => {
    const m = /^\s*([A-Za-z0-9_]+)\s/.exec(line);
    if (!m) return line;
    const key = m[1];
    if (key in keys) {
      seen[key] = true;
      return `${key} ${keys[key]}`;
    }
    return line;
  });
  for (const [key, val] of Object.entries(keys)) {
    if (!seen[key]) out.push(`${key} ${val}`);
  }
  return out.join("\n").replace(/\n*$/, "\n");
}

function findLibEntry(files) {
  if (files["lib/arm64-v8a/libyoyo.so"]) return "lib/arm64-v8a/libyoyo.so";
  const keys = Object.keys(files);
  const hit = keys.find((k) => /^lib\/arm64-v8a\/lib.*yoyo.*\.so$/i.test(k));
  if (hit) return hit;
  const any = keys.filter((k) => /lib\/.+\/lib.*yoyo.*\.so$/i.test(k));
  throw new Error(
    `Origins APK missing lib/arm64-v8a/libyoyo.so. Found: ${any.join(", ") || "(none)"}`
  );
}

/** Unpack hosted libyoyo.so.zip → bare .so bytes. */
function extractLibyoyoFromZip(zipBytes) {
  let files;
  try {
    files = unzipSync(zipBytes);
  } catch (err) {
    throw new Error(`Could not read libyoyo.so.zip: ${err.message || err}`);
  }
  const keys = Object.keys(files).filter((k) => !k.endsWith("/"));
  const hit =
    keys.find((k) => /(^|\/)libyoyo\.so$/i.test(k.replace(/\\/g, "/"))) ||
    keys.find((k) => /\.so$/i.test(k));
  if (!hit) {
    throw new Error(
      `libyoyo.so.zip missing libyoyo.so. Found: ${keys.join(", ") || "(none)"}`
    );
  }
  return files[hit];
}

/**
 * @param {File} apkFile
 * @param {(msg: string, pct: number) => void} onProgress
 * @returns {Promise<{ zip: Uint8Array, filename: string }>}
 */
export async function prepareSdPackage(apkFile, onProgress) {
  const report = makeReporter(onProgress);

  await report("Scanning package...", 2);

  const apkBuf = new Uint8Array(await apkFile.arrayBuffer());
  let apkFiles;
  try {
    apkFiles = unzipSync(apkBuf, {
      filter: (file) => {
        const path = file.name || "";
        return (
          path === "lib/arm64-v8a/libyoyo.so" ||
          /^lib\/arm64-v8a\/lib.*yoyo.*\.so$/i.test(path) ||
          path.startsWith("assets/")
        );
      },
    });
  } catch (err) {
    throw new Error(`Could not read APK as zip: ${err.message || err}`);
  }

  const libKey = findLibEntry(apkFiles);
  const stockLib = apkFiles[libKey];
  if (!apkFiles["assets/game.droid"]) {
    throw new Error("Origins APK missing assets/game.droid.");
  }
  const stockDroid = apkFiles["assets/game.droid"];

  await report("Verifying official Origins 1.1.2 signature...", 18);
  const manifest = JSON.parse(await fetchText(KIT.updateManifest));
  const req = manifest.requiresOfficialApk || {};
  const pack = manifest.pack || {};
  const stockLibHash = await sha256Hex(stockLib);
  const stockDroidHash = await sha256Hex(stockDroid);
  if (
    (req.libyoyoSha256 && stockLibHash !== req.libyoyoSha256) ||
    (req.gameDroidSha256 && stockDroidHash !== req.gameDroidSha256)
  ) {
    throw new Error(
      "This tool requires the official Metroid Prime Origins Android YYC APK v1.1.2 " +
        "(stock runner + game.droid). Other builds (including already-updated personal APKs) are rejected."
    );
  }

  await report("Fetching NX update pack + wrapper kit...", 28);
  const [nro, configRaw, sdl2Root, controllerDb, prepend, updateLibZip, updateDroid] =
    await Promise.all([
      fetchBytes(KIT.nro, "mpo_nx.nro"),
      fetchText(KIT.config),
      fetchBytes(KIT.sdl2, "sdl2.txt"),
      fetchBytes(KIT.controller, "gamecontrollerdb.txt"),
      fetchText(KIT.prepend),
      fetchBytes(KIT.updateLibZip, "update libyoyo.so.zip", (m) =>
        onProgress && onProgress(m, 34)
      ),
      fetchBytes(KIT.updateDroid, "update game.droid", (m) =>
        onProgress && onProgress(m, 40)
      ),
    ]);

  const updateLib = extractLibyoyoFromZip(updateLibZip);

  const packLibHash = await sha256Hex(updateLib);
  const packDroidHash = await sha256Hex(updateDroid);
  if (
    (pack.libyoyoSha256 && packLibHash !== pack.libyoyoSha256) ||
    (pack.gameDroidSha256 && packDroidHash !== pack.gameDroidSha256)
  ) {
    throw new Error(
      `Update pack ${UPDATE_VERSION} failed integrity check. Re-download the site kit / hard-refresh.`
    );
  }

  const out = {};
  out["mpo_nx/mpo_nx.nro"] = nro;
  out["mpo_nx/config.txt"] = new TextEncoder().encode(ensureConfigDefaults(configRaw));
  out["mpo_nx/gamecontrollerdb.txt"] = controllerDb;
  out["mpo_nx/sdl2.txt"] = new TextEncoder().encode(prepend);
  out["mpo_nx/libyoyo.so"] = updateLib;
  /* Keep the user's official APK as game.apk (legal + assets donor). Loose lib/assets win. */
  out["mpo_nx/game.apk"] = apkBuf;

  const assetKeys = Object.keys(apkFiles).filter(
    (k) => k.startsWith("assets/") && !k.endsWith("/")
  );
  if (assetKeys.length === 0) throw new Error("Origins APK has no assets/ entries.");

  await report(`Cataloguing ${assetKeys.length} asset files from official APK...`, 55);
  let i = 0;
  let lastCatalogPct = -1;
  for (const key of assetKeys) {
    const rel = key.slice("assets/".length);
    let data = apkFiles[key];
    if (rel.replace(/\\/g, "/") === "game.droid") {
      data = updateDroid;
    } else if (rel.replace(/\\/g, "/") === "sdl2.txt") {
      const existing = new TextDecoder().decode(data);
      data = new TextEncoder().encode(prepend + existing);
    }
    out[`mpo_nx/assets/${rel}`] = data;
    i++;
    if (i % 40 === 0 || i === assetKeys.length) {
      const pct = 55 + Math.floor((i / assetKeys.length) * 30);
      if (pct !== lastCatalogPct) {
        lastCatalogPct = pct;
        await report(`Cataloguing artifacts... ${i}/${assetKeys.length}`, pct, {
          dwell: false,
        });
        await tick();
      }
    }
  }

  if (!out["mpo_nx/assets/sdl2.txt"]) {
    out["mpo_nx/assets/sdl2.txt"] = sdl2Root;
  }
  out["mpo_nx/assets/game.droid"] = updateDroid;

  await report("Assembling SD image. Log 99.prep.1 - zip in progress...", 88);
  const zip = await buildZip(out);
  await report(`Data decoded. Package ready (${UPDATE_VERSION}).`, 100);

  return {
    zip,
    filename: `mpo_nx-${UPDATE_VERSION}-sd.zip`,
  };
}
