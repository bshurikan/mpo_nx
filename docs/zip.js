const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * CRC in multi-MB inner loops (fast) with yields + optional progress between chunks.
 * Per-byte await was still too heavy on a 238MB game.apk.
 */
async function crc32Async(bytes, onChunk) {
  let c = 0xffffffff;
  const chunk = 2 * 1024 * 1024;
  const total = bytes.length || 1;
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length);
    for (let j = i; j < end; j++) {
      c = CRC_TABLE[(c ^ bytes[j]) & 0xff] ^ (c >>> 8);
    }
    if (onChunk) onChunk(Math.min(1, end / total));
    await sleep(0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(date = new Date()) {
  const t =
    ((date.getHours() & 31) << 11) |
    ((date.getMinutes() & 63) << 5) |
    (Math.floor(date.getSeconds() / 2) & 31);
  const d =
    (((date.getFullYear() - 1980) & 127) << 9) |
    (((date.getMonth() + 1) & 15) << 5) |
    (date.getDate() & 31);
  return { t, d };
}

function utf8(str) {
  return new TextEncoder().encode(str);
}

function u16(n) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

/**
 * Build a ZIP as a Blob — file payloads are referenced, not copied into one giant buffer.
 * That keeps peak RAM roughly “input size” instead of 2–3× during assemble.
 *
 * @param {Record<string, Uint8Array>} files
 * @param {(msg: string, frac: number) => void} [onProgress] frac 0..1 across all bytes
 * @returns {Promise<Blob>}
 */
export async function buildZip(files, onProgress) {
  const now = dosTime();
  const names = Object.keys(files).sort();
  const totalBytes = names.reduce((n, name) => n + (files[name]?.length || 0), 0) || 1;
  let doneBytes = 0;

  const parts = [];
  const centrals = [];
  let offset = 0;

  for (let n = 0; n < names.length; n++) {
    const name = names[n];
    const data = files[name];
    const nameBytes = utf8(name);
    const short = name.replace(/^mpo_nx\//, "");

    if (onProgress) {
      onProgress(`Assembling SD image — hashing ${short}...`, doneBytes / totalBytes);
    }

    const crc = await crc32Async(data, (frac) => {
      if (onProgress) {
        const overall = (doneBytes + frac * data.length) / totalBytes;
        onProgress(`Assembling SD image — hashing ${short}...`, overall);
      }
    });

    /* Local file header only — payload appended by reference (no memcpy). */
    const localHead = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHead.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, 0, true); /* store, no compression */
    view.setUint16(10, now.t, true);
    view.setUint16(12, now.d, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    localHead.set(nameBytes, 30);

    parts.push(localHead, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, now.t, true);
    cv.setUint16(14, now.d, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += localHead.length + data.length;
    doneBytes += data.length;
    if (onProgress) {
      onProgress(`Assembling SD image — packed ${short}`, doneBytes / totalBytes);
    }
    await sleep(0);
  }

  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  for (const c of centrals) parts.push(c);

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, names.length, true);
  ev.setUint16(10, names.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  parts.push(end);

  if (onProgress) onProgress("Assembling SD image — finalizing download...", 1);
  await sleep(0);
  return new Blob(parts, { type: "application/zip" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** @deprecated use downloadBlob */
export function downloadBytes(bytes, filename) {
  downloadBlob(new Blob([bytes], { type: "application/zip" }), filename);
}
