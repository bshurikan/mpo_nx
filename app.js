import "./bg.js";
import { prepareSdPackage } from "./prepare.js";
import { downloadBlob } from "./zip.js";

/**
 * TOP: funny flavor — equal timed holds (job % is uneven: unzip/fetch long,
 * cataloguing flies by, so %-buckets made "Don't feed the Metroids" flash).
 * CONSOLE: technical status — typewriter; wrap enabled.
 */
const STATUS_FLAVOR = [
  "Space Pirate encrypted data decoded.",
  "Science Team requests additional coffee rations.",
  "Don't feed the Metroids.",
];
/** Each flavor stays this long, then advances; last one holds until done. */
const FLAVOR_HOLD_MS = 3200;

const CONSOLE_TYPE_MS = 4;
const CONSOLE_CHUNK = 4;
const CONSOLE_GAP_MS = 50;
const CONSOLE_MAX_LINES = 8;

const fileInput = document.getElementById("file");
const drop = document.getElementById("drop");
const dropHint = document.getElementById("drop-hint");
const createBtn = document.getElementById("create");
const clearBtn = document.getElementById("clear");
const statusEl = document.getElementById("status");
const muteBtn = document.getElementById("mute");
const progressDlg = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressMsg = document.getElementById("progress-msg");
const progressLog = document.getElementById("progress-log");
const consoleViewport = document.getElementById("console-viewport");
const progressClose = document.getElementById("progress-close");
const progressDownload = document.getElementById("progress-download");
const autoDownloadEl = document.getElementById("auto-download");
const metroidCanvas = document.getElementById("metroid");

let apkFile = null;
let muted = localStorage.getItem("mpo_prep_mute") === "1";
let autoDownload = localStorage.getItem("mpo_prep_autodl") === "1";
let flavorRunId = 0;
let flavorTimer = null;
let flavorIdx = 0;
let consoleRunId = 0;
let consoleQueue = [];
let consolePumping = false;
let jobActive = false;
let pendingZip = null;
let pendingFilename = "";

const sfx = {
  metroid: new Audio("./assets/sfx/metroid.wav"),
  scan: new Audio("./assets/sfx/scan.wav"),
  logbook: new Audio("./assets/sfx/logbook.wav"),
};
for (const a of Object.values(sfx)) {
  a.preload = "auto";
  a.volume = 0.35;
}

function play(name) {
  if (muted) return;
  const a = sfx[name];
  if (!a) return;
  try {
    a.currentTime = 0;
    void a.play();
  } catch (_) {
    /* autoplay policies */
  }
}

function setMuteUi() {
  muteBtn.textContent = muted ? "Sound: off" : "Sound: on";
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
}

muteBtn.addEventListener("click", () => {
  muted = !muted;
  localStorage.setItem("mpo_prep_mute", muted ? "1" : "0");
  setMuteUi();
});
setMuteUi();

/* ---- Metroid idle animation ---- */
const frames = [];
let frameIdx = 0;
let lastFrame = 0;
let metroidAlive = false;
const FRAME_MS = 1000 / 6;

function setMetroidAlive(on) {
  metroidAlive = !!on;
  metroidCanvas.classList.toggle("alive", metroidAlive);
  if (!metroidAlive) {
    frameIdx = 0;
  }
}

async function loadMetroid() {
  const urls = [0, 1, 2, 3].map((i) => `./assets/metroid/${i}.png`);
  for (const url of urls) {
    const img = new Image();
    img.src = url;
    await img.decode();
    frames.push(img);
  }
  const ctx = metroidCanvas.getContext("2d");
  const scale = 3;
  metroidCanvas.width = 23 * scale;
  metroidCanvas.height = 23 * scale;
  ctx.imageSmoothingEnabled = false;
  setMetroidAlive(false);

  function draw(ts) {
    if (!frames.length) return;
    if (metroidAlive) {
      if (ts - lastFrame >= FRAME_MS) {
        frameIdx = (frameIdx + 1) % frames.length;
        lastFrame = ts;
      }
    } else {
      frameIdx = 0;
    }
    const bob = metroidAlive ? Math.sin(ts / 450) * 1.5 : 0;
    ctx.clearRect(0, 0, metroidCanvas.width, metroidCanvas.height);
    ctx.drawImage(
      frames[frameIdx],
      0,
      bob,
      metroidCanvas.width,
      metroidCanvas.height
    );
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
loadMetroid().catch(() => {});

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || "";
}

function setApk(file) {
  if (!file) {
    apkFile = null;
    dropHint.textContent = "Drop official Origins 1.1.2 APK or tap to browse";
    createBtn.disabled = true;
    setStatus("");
    setMetroidAlive(false);
    return;
  }
  if (!/\.apk$/i.test(file.name) && file.type !== "application/vnd.android.package-archive") {
    setStatus("That doesn't look like an APK. Use the official Origins 1.1.2 package.");
    return;
  }
  apkFile = file;
  dropHint.textContent = `${file.name}  -  ${(file.size / 1e6).toFixed(1)} MB`;
  createBtn.disabled = false;
  setStatus("APK locked. Press Prepare SD when ready.");
  setMetroidAlive(true);
  play("metroid");
}

drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const f = fileInput.files && fileInput.files[0];
  setApk(f || null);
});

["dragenter", "dragover"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("drag");
  });
});
["dragleave", "drop"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
  });
});
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  setApk(f || null);
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  setApk(null);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stopFlavorTop() {
  flavorRunId += 1;
  if (flavorTimer != null) {
    clearTimeout(flavorTimer);
    flavorTimer = null;
  }
}

/** Even on-screen time per line; independent of uneven job phases. */
function startFlavorRotation() {
  stopFlavorTop();
  flavorIdx = 0;
  progressMsg.textContent = STATUS_FLAVOR[0];
  const runId = flavorRunId;
  const advance = () => {
    if (runId !== flavorRunId || !jobActive) return;
    if (flavorIdx >= STATUS_FLAVOR.length - 1) return;
    flavorIdx += 1;
    progressMsg.textContent = STATUS_FLAVOR[flavorIdx];
    flavorTimer = setTimeout(advance, FLAVOR_HOLD_MS);
  };
  flavorTimer = setTimeout(advance, FLAVOR_HOLD_MS);
}

function stopConsole() {
  consoleRunId += 1;
  consoleQueue = [];
  consolePumping = false;
}

function clearConsole() {
  if (consoleViewport) consoleViewport.replaceChildren();
}

function makeConsoleCursor() {
  const cursor = document.createElement("span");
  cursor.className = "console-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.textContent = "█";
  return cursor;
}

/** Keep one blinking caret at the end of the log (matches focus pulse). */
function ensureIdleCursor() {
  if (!consoleViewport) return;
  consoleViewport.querySelectorAll(".console-cursor").forEach((el) => el.remove());
  const last = consoleViewport.lastElementChild;
  if (last) {
    last.appendChild(makeConsoleCursor());
    return;
  }
  const line = document.createElement("div");
  line.className = "console-line console-line-idle";
  line.appendChild(makeConsoleCursor());
  consoleViewport.appendChild(line);
}

function appendConsoleLine() {
  if (!consoleViewport) return { line: null, text: null, cursor: null };
  consoleViewport.querySelectorAll(".console-cursor").forEach((el) => el.remove());
  consoleViewport.querySelectorAll(".console-line-idle").forEach((el) => el.remove());
  const line = document.createElement("div");
  line.className = "console-line";
  const text = document.createElement("span");
  text.className = "console-text";
  const cursor = makeConsoleCursor();
  line.append(text, cursor);
  consoleViewport.appendChild(line);
  while (consoleViewport.children.length > CONSOLE_MAX_LINES) {
    consoleViewport.firstElementChild.remove();
  }
  return { line, text, cursor };
}

function finishConsoleRow(row) {
  row.cursor?.remove();
  row.line?.classList.add("console-line-done");
  ensureIdleCursor();
}

/** Typing vibe when caught up; snap when backlog so we never hang past the job. */
async function typeConsoleLine(text, runId, { snap = false } = {}) {
  const row = appendConsoleLine();
  if (snap) {
    row.text.textContent = text;
    finishConsoleRow(row);
    await sleep(CONSOLE_GAP_MS);
    return runId === consoleRunId;
  }
  for (let i = 0; i < text.length; i += CONSOLE_CHUNK) {
    if (runId !== consoleRunId) return false;
    row.text.textContent += text.slice(i, i + CONSOLE_CHUNK);
    await sleep(CONSOLE_TYPE_MS);
    /* Backlog growing — finish this line now and let pump catch up. */
    if (consoleQueue.length > 0) {
      row.text.textContent = text;
      break;
    }
  }
  if (runId !== consoleRunId) return false;
  finishConsoleRow(row);
  await sleep(CONSOLE_GAP_MS);
  return runId === consoleRunId;
}

async function pumpConsole(runId) {
  if (consolePumping) return;
  consolePumping = true;
  while (runId === consoleRunId && consoleQueue.length) {
    const msg = consoleQueue.shift();
    const snap = consoleQueue.length >= 2;
    const ok = await typeConsoleLine(msg, runId, { snap });
    if (!ok) break;
  }
  if (runId === consoleRunId) consolePumping = false;
}

function enqueueConsole(msg) {
  if (!msg) return;
  const lines = String(msg)
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  consoleQueue.push(...lines);
  void pumpConsole(consoleRunId);
}

async function flushConsoleThen(finalMessage) {
  const runId = consoleRunId;
  const deadline = performance.now() + 600;
  while (
    runId === consoleRunId &&
    (consolePumping || consoleQueue.length) &&
    performance.now() < deadline
  ) {
    if (!consolePumping && consoleQueue.length) void pumpConsole(runId);
    await sleep(16);
  }
  if (runId !== consoleRunId) return;
  /* Snap any leftovers so every status line was shown. */
  const leftover = consoleQueue.slice();
  consoleQueue = [];
  consolePumping = false;
  for (const msg of leftover) {
    const row = appendConsoleLine();
    row.text.textContent = msg;
    finishConsoleRow(row);
  }
  for (const part of String(finalMessage).split(/\n+/).filter(Boolean)) {
    const row = appendConsoleLine();
    row.text.textContent = part;
    finishConsoleRow(row);
  }
  ensureIdleCursor();
}

let lastConsoleMsg = "";

function setProgress(msg, pct) {
  progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  /* Assemble hash spam: rewrite the current console line instead of flooding. */
  if (/^Assembling SD image - hashing/.test(msg)) {
    const lines = consoleViewport?.querySelectorAll(".console-line");
    const last = lines && lines[lines.length - 1];
    const text = last?.querySelector(".console-text");
    if (text) {
      text.textContent = msg;
      return;
    }
  }
  if (msg === lastConsoleMsg) return;
  lastConsoleMsg = msg;
  enqueueConsole(msg);
}

function setDownloadReady(zip, filename) {
  pendingZip = zip;
  pendingFilename = filename || "mpo_nx.zip";
  progressDownload.disabled = !zip;
}

function triggerPendingDownload() {
  if (!pendingZip) return;
  downloadBlob(pendingZip, pendingFilename);
  setStatus("Downloaded. See How to install for instructions.");
}

function openProgress() {
  progressBar.style.width = "0%";
  progressClose.hidden = true;
  setDownloadReady(null, "");
  jobActive = true;
  lastConsoleMsg = "";
  stopConsole();
  clearConsole();
  ensureIdleCursor();
  consoleRunId += 1;
  startFlavorRotation();
  progressDlg.showModal();
  play("scan");
}

function closeProgressSoon() {
  jobActive = false;
  stopFlavorTop();
  progressClose.hidden = false;
}

if (autoDownloadEl) {
  autoDownloadEl.checked = autoDownload;
  autoDownloadEl.addEventListener("change", () => {
    autoDownload = !!autoDownloadEl.checked;
    localStorage.setItem("mpo_prep_autodl", autoDownload ? "1" : "0");
  });
}

progressClose.addEventListener("click", () => progressDlg.close());
progressDownload.addEventListener("click", () => {
  if (progressDownload.disabled) return;
  triggerPendingDownload();
});

createBtn.addEventListener("click", async () => {
  if (!apkFile || createBtn.disabled) return;
  createBtn.disabled = true;
  openProgress();
  try {
    const { zip, filename } = await prepareSdPackage(apkFile, setProgress);
    jobActive = false;
    stopFlavorTop();
    progressMsg.textContent = "Mission complete.";
    setDownloadReady(zip, filename);
    progressBar.style.width = "100%";
    if (autoDownload) {
      triggerPendingDownload();
    } else {
      setStatus("Package ready. Press Download when you want the zip.");
    }
    await flushConsoleThen(
      "Extract and copy mpo_nx/ to sdmc:/switch/mpo_nx/\n" +
        "Full RAM launch (hold R) or Forwarder"
    );
  } catch (err) {
    console.error(err);
    jobActive = false;
    stopFlavorTop();
    progressMsg.textContent = "Mission failed.";
    progressBar.style.width = "100%";
    setDownloadReady(null, "");
    await flushConsoleThen(err.message || String(err));
    setStatus(err.message || String(err));
    play("metroid");
  } finally {
    closeProgressSoon();
    createBtn.disabled = !apkFile;
  }
});

document.getElementById("help-open").addEventListener("click", () => {
  document.getElementById("help").showModal();
});
document.getElementById("help-close").addEventListener("click", () => {
  document.getElementById("help").close();
});

setApk(null);
