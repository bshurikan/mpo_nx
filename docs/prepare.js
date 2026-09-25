import { unzipSync } from "./vendor/fflate.esm.js";
import { applyLibyoyoPatch } from "./patch.js";
import { buildZip } from "./zip.js";

const KIT = {
  nro: "./kit/mpo_nx.nro",
  config: "./kit/config.txt",
  sdl2: "./kit/sdl2.txt",
  controller: "./kit/gamecontrollerdb.txt",
  prepend: "./kit/sdl2_yyc_prepend.txt",
  patch: "./kit/patches/ship_teleport_yyc_1.1.2.json",
};

function tick() {
  return new Promise((r) => setTimeout(r, 0));
}

async function fetchBytes(url, label, onProgress) {
  if (onProgress) onProgress(`Fetching ${label}...`);
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

function ensureInputProfile(configText) {
  const lines = configText.replace(/\r\n/g, "\n").split("\n");
  let found = false;
  const out = lines.map((line) => {
    if (/^\s*input_profile\s/.test(line)) {
      found = true;
      return "input_profile 1";
    }
    return line;
  });
  if (!found) out.push("input_profile 1");
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

/**
 * @param {File} apkFile
 * @param {(msg: string, pct: number) => void} onProgress
 * @returns {Promise<{ zip: Uint8Array, filename: string }>}
 */
export async function prepareSdPackage(apkFile, onProgress) {
  const report = (msg, pct) => {
    if (onProgress) onProgress(msg, pct);
  };

  report("Space Pirate encrypted data decoded. Scanning package...", 2);
  await tick();

  const apkBuf = new Uint8Array(await apkFile.arrayBuffer());
  report(`Payload acquired (${(apkBuf.length / 1e6).toFixed(1)} MB). Opening archive...`, 8);
  await tick();

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
  let libBytes = apkFiles[libKey];
  report(`Extracted ${libKey} (${(libBytes.length / 1e6).toFixed(1)} MB).`, 18);
  await tick();

  report("Fetching wrapper kit from local cache...", 22);
  const [nro, configRaw, sdl2Root, controllerDb, prepend, patchJsonText] = await Promise.all([
    fetchBytes(KIT.nro, "mpo_nx.nro", (m) => report(m, 24)),
    fetchText(KIT.config),
    fetchBytes(KIT.sdl2, "sdl2.txt"),
    fetchBytes(KIT.controller, "gamecontrollerdb.txt"),
    fetchText(KIT.prepend),
    fetchText(KIT.patch),
  ]);
  const patchDef = JSON.parse(patchJsonText);
  report("Runner signature check in progress. Science Team advises patience.", 35);
  await tick();

  report("Injecting teleport-mod firmware. Do not feed the Metroids.", 42);
  libBytes = await applyLibyoyoPatch(libBytes, patchDef);
  report("Teleport mods applied. Hash verified.", 55);
  await tick();

  const out = {};
  out["mpo_nx/mpo_nx.nro"] = nro;
  out["mpo_nx/config.txt"] = new TextEncoder().encode(ensureInputProfile(configRaw));
  out["mpo_nx/gamecontrollerdb.txt"] = controllerDb;
  out["mpo_nx/sdl2.txt"] = new TextEncoder().encode(prepend);
  out["mpo_nx/libyoyo.so"] = libBytes;
  out["mpo_nx/game.apk"] = apkBuf;

  const assetKeys = Object.keys(apkFiles).filter(
    (k) => k.startsWith("assets/") && !k.endsWith("/")
  );
  if (assetKeys.length === 0) throw new Error("Origins APK has no assets/ entries.");

  report(`Decrypting ${assetKeys.length} asset files...`, 60);
  let i = 0;
  for (const key of assetKeys) {
    const rel = key.slice("assets/".length);
    let data = apkFiles[key];
    if (rel.replace(/\\/g, "/") === "sdl2.txt") {
      const existing = new TextDecoder().decode(data);
      data = new TextEncoder().encode(prepend + existing);
    }
    out[`mpo_nx/assets/${rel}`] = data;
    i++;
    if (i % 40 === 0) {
      const pct = 60 + Math.floor((i / assetKeys.length) * 25);
      report(`Cataloguing artifacts... ${i}/${assetKeys.length}`, pct);
      await tick();
    }
  }

  // Prefer kit sdl2 into assets if somehow missing
  if (!out["mpo_nx/assets/sdl2.txt"]) {
    out["mpo_nx/assets/sdl2.txt"] = sdl2Root;
  }

  report("Assembling SD image. Log 99.prep.1 - zip in progress...", 88);
  await tick();
  const zip = await buildZip(out);
  report("Data decoded. Package ready. [[RATIONS UNCHANGED.]]", 100);
  await tick();

  const stem = (apkFile.name || "origins").replace(/\.apk$/i, "");
  return {
    zip,
    filename: `${stem}-mpo_nx-sd.zip`,
  };
}
