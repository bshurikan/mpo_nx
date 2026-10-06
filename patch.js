/* Port of mpo-switch tools/prepare_sd.ps1 Apply-LibyoyoPatch */

function hexBytes(hex) {
  const tokens = hex.trim().split(/\s+/).filter(Boolean);
  const out = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "??") throw new Error(`Wildcards not allowed in byte value '${hex}'`);
    out[i] = parseInt(tokens[i], 16);
  }
  return out;
}

function hexInt(value) {
  const text = String(value);
  if (text.toLowerCase().startsWith("0x")) return Number.parseInt(text.slice(2), 16);
  return Number.parseInt(text, 10);
}

function compilePattern(pattern) {
  const tokens = pattern.trim().split(/\s+/).filter(Boolean);
  const values = new Uint8Array(tokens.length);
  const mask = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== "??") {
      values[i] = parseInt(tokens[i], 16);
      mask[i] = 0xff;
    }
  }
  return { values, mask };
}

function findAllMasked(data, values, mask) {
  const matches = [];
  const n = values.length;
  outer: for (let i = 0; i <= data.length - n; i++) {
    for (let j = 0; j < n; j++) {
      if (mask[j] && data[i + j] !== values[j]) continue outer;
    }
    matches.push(i);
  }
  return matches;
}

function setU32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function setU64(view, offset, value) {
  const lo = value >>> 0;
  const hi = Math.floor(value / 0x100000000) >>> 0;
  view.setUint32(offset, lo, true);
  view.setUint32(offset + 4, hi, true);
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * @param {Uint8Array} libBytes
 * @param {object} definition patch JSON
 * @returns {Promise<Uint8Array>}
 */
export async function applyLibyoyoPatch(libBytes, definition) {
  const sourceHash = await sha256Hex(libBytes);
  const patchedHash = String(definition.patchedSha256).toUpperCase();

  if (sourceHash === patchedHash) {
    return libBytes;
  }

  const allowed = (definition.sourceSha256 || []).map((h) => String(h).toUpperCase());
  const legacy = (definition.legacyPatchedSha256 || []).map((h) => String(h).toUpperCase());
  const upgrades = (definition.upgradePatchedSha256 || []).map((h) => String(h).toUpperCase());
  const isLegacy = legacy.includes(sourceHash);
  const isUpgrade = upgrades.includes(sourceHash);

  if (!allowed.includes(sourceHash) && !isLegacy && !isUpgrade) {
    throw new Error(
      `Unsupported libyoyo.so. Need Origins YYC 1.1.2 (or a known prior patch). Got SHA-256 ${sourceHash}`
    );
  }

  let bytes = new Uint8Array(libBytes);

  const planned = [];
  for (const patch of definition.patches) {
    const { values, mask } = compilePattern(patch.pattern);
    const matches = findAllMasked(bytes, values, mask);
    if (matches.length !== 1) {
      throw new Error(`Patch '${patch.name}' matched ${matches.length} locations; expected 1.`);
    }
    const target = matches[0] + (patch.patchOffset | 0);
    let beforeText;
    if (isUpgrade) {
      const byHash = patch.upgradeBeforeByHash && patch.upgradeBeforeByHash[sourceHash];
      beforeText = byHash || patch.upgradeBefore;
    } else if (isLegacy) {
      beforeText = patch.legacyBefore;
    } else {
      beforeText = patch.before;
    }
    const before = hexBytes(beforeText);
    const after = hexBytes(patch.after);
    if (before.length !== after.length) {
      throw new Error(`Patch '${patch.name}' changes byte count.`);
    }
    for (let i = 0; i < before.length; i++) {
      if (bytes[target + i] !== before[i]) {
        throw new Error(
          `Patch '${patch.name}' unexpected bytes at 0x${target.toString(16).toUpperCase()}.`
        );
      }
    }
    planned.push({ name: patch.name, target, after });
  }

  const segment = definition.injectedSegment;
  const segmentOffset = hexInt(segment.fileOffset);
  const segmentVaddr = hexInt(segment.virtualAddress);
  const segmentSize = hexInt(segment.fileSize);
  const segmentAlign = hexInt(segment.alignment);

  if (isUpgrade) {
    if (bytes.length < segmentOffset + segmentSize) {
      throw new Error("Previous runtime patch is missing its injected segment.");
    }
  } else {
    if (bytes.length > segmentOffset) {
      throw new Error(
        `Injected segment offset 0x${segmentOffset.toString(16)} overlaps libyoyo.so data.`
      );
    }
    const expanded = new Uint8Array(segmentOffset + segmentSize);
    expanded.set(bytes);
    bytes = expanded;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const phoffLo = view.getUint32(0x20, true);
  const phoffHi = view.getUint32(0x24, true);
  const phoff = phoffHi * 0x100000000 + phoffLo;
  const phentsize = view.getUint16(0x36, true);
  const phnum = view.getUint16(0x38, true);
  const phindex = segment.programHeaderIndex | 0;
  if (phindex < 0 || phindex >= phnum || phentsize < 56) {
    throw new Error(`Invalid injected segment program-header slot ${phindex}.`);
  }
  const ph = phoff + phindex * phentsize;
  setU32(view, ph + 0, 1);
  setU32(view, ph + 4, 5);
  setU64(view, ph + 8, segmentOffset);
  setU64(view, ph + 16, segmentVaddr);
  setU64(view, ph + 24, segmentVaddr);
  setU64(view, ph + 32, segmentSize);
  setU64(view, ph + 40, segmentSize);
  setU64(view, ph + 48, segmentAlign);

  for (const stub of segment.stubs) {
    const stubOffset = segmentOffset + hexInt(stub.segmentOffset);
    const stubBytes = hexBytes(stub.bytes);
    if (stubOffset + stubBytes.length > segmentOffset + segmentSize) {
      throw new Error(`Injected stub '${stub.name}' exceeds its segment.`);
    }
    bytes.set(stubBytes, stubOffset);
  }

  for (const patch of planned) {
    bytes.set(patch.after, patch.target);
  }

  const resultHash = await sha256Hex(bytes);
  if (resultHash !== patchedHash) {
    throw new Error(`Patched libyoyo.so hash mismatch. Expected ${patchedHash}; got ${resultHash}`);
  }
  return bytes;
}

export { sha256Hex };
