import "./bg.js";
import { prepareSdPackage } from "./prepare.js";
import { downloadBytes } from "./zip.js";

const STATUS_FLAVOR = [
  "Space Pirate encrypted data decoded.",
  "Science Team requests additional coffee rations.",
  "Scan visor locked. Object: game.apk",
  "[[INFRACTION: impatience detected. Rations unchanged.]]",
  "Metroid containment nominal. Probably.",
  "GF protocol 1.1.2 - YYC runner preferred.",
];

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
const progressClose = document.getElementById("progress-close");
const metroidCanvas = document.getElementById("metroid");

let apkFile = null;
let muted = localStorage.getItem("mpo_prep_mute") === "1";
let flavorTimer = 0;

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
    dropHint.textContent = "Drop Origins 1.1.2+ APK or tap to browse";
    createBtn.disabled = true;
    setStatus("");
    setMetroidAlive(false);
    return;
  }
  if (!/\.apk$/i.test(file.name) && file.type !== "application/vnd.android.package-archive") {
    setStatus("That doesn't look like an APK. Try the Origins 1.1.2 package.");
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

function openProgress() {
  progressBar.style.width = "0%";
  progressMsg.textContent = STATUS_FLAVOR[0];
  progressLog.textContent = "";
  progressClose.hidden = true;
  progressDlg.showModal();
  play("scan");
  let i = 0;
  clearInterval(flavorTimer);
  flavorTimer = setInterval(() => {
    i = (i + 1) % STATUS_FLAVOR.length;
    if (progressClose.hidden) {
      progressLog.textContent = STATUS_FLAVOR[i];
    }
  }, 3200);
}

function setProgress(msg, pct) {
  progressMsg.textContent = msg;
  progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function closeProgressSoon() {
  clearInterval(flavorTimer);
  progressClose.hidden = false;
}

progressClose.addEventListener("click", () => progressDlg.close());

createBtn.addEventListener("click", async () => {
  if (!apkFile || createBtn.disabled) return;
  createBtn.disabled = true;
  openProgress();
  try {
    const { zip, filename } = await prepareSdPackage(apkFile, setProgress);
    play("logbook");
    downloadBytes(zip, filename);
    setProgress("Mission complete.\nDownload starting...", 100);
    progressLog.textContent =
      "Copy mpo_nx/ to sdmc:/switch/\nUse full RAM launch or Forwarder";
    setStatus("Downloaded. See How to install for instructions.");
  } catch (err) {
    console.error(err);
    setProgress("Mission failed.", 100);
    progressLog.textContent = err.message || String(err);
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
