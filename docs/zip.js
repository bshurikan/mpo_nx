const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** CRC in chunks so huge files (game.apk ~238MB) don't freeze the tab. */
async function crc32Async(bytes) {
  let c = 0xffffffff;
  const chunk = 512 * 1024;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    if (i > 0 && i % chunk === 0) await sleep(0);
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

export async function buildZip(files) {
  const now = dosTime();
  const locals = [];
  const centrals = [];
  let offset = 0;
  const names = Object.keys(files).sort();

  for (let n = 0; n < names.length; n++) {
    const name = names[n];
    const data = files[name];
    const nameBytes = utf8(name);
    const crc = await crc32Async(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, now.t, true);
    view.setUint16(12, now.d, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    /* Copy large payloads in slices so the UI can paint. */
    const payloadAt = 30 + nameBytes.length;
    const slice = 1024 * 1024;
    for (let i = 0; i < data.length; i += slice) {
      local.set(data.subarray(i, Math.min(i + slice, data.length)), payloadAt + i);
      if (data.length > slice) await sleep(0);
    }
    locals.push(local);

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
    offset += local.length;
    await sleep(0);
  }

  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, names.length, true);
  ev.setUint16(10, names.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const total = offset + centralSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of locals) {
    const slice = 1024 * 1024;
    for (let i = 0; i < part.length; i += slice) {
      out.set(part.subarray(i, Math.min(i + slice, part.length)), pos + i);
      if (part.length > slice) await sleep(0);
    }
    pos += part.length;
  }
  for (const part of centrals) {
    out.set(part, pos);
    pos += part.length;
  }
  out.set(end, pos);
  return out;
}

export function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
