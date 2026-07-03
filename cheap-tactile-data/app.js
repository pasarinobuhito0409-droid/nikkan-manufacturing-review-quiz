const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const installButton = document.getElementById("installButton");
const saveButton = document.getElementById("saveButton");
const saveStatus = document.getElementById("saveStatus");
const viewer = document.getElementById("viewer");
const viewerImage = document.getElementById("viewerImage");
const viewerCaption = document.getElementById("viewerCaption");
const closeViewer = document.getElementById("closeViewer");
const storageKey = "cheap-tactile-data-invention-pin-v1";
let deferredPrompt = null;

function setPanel(id) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.panel === id));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === id));
}

function updateSaveStatus() {
  const savedAt = localStorage.getItem(storageKey);
  saveStatus.textContent = savedAt ? `固定済み：${savedAt}` : "未固定";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setPanel(tab.dataset.panel));
});

saveButton.addEventListener("click", () => {
  const now = new Date();
  const label = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  localStorage.setItem(storageKey, label);
  updateSaveStatus();
});

document.querySelectorAll(".image-button").forEach((button) => {
  button.addEventListener("click", () => {
    viewerImage.src = button.dataset.image;
    viewerImage.alt = button.querySelector("img")?.alt || "発明メモ画像";
    viewerCaption.textContent = button.dataset.caption || "画像";
    viewer.hidden = false;
    document.body.classList.add("viewer-open");
    closeViewer.focus();
  });
});

function hideViewer() {
  viewer.hidden = true;
  viewerImage.removeAttribute("src");
  document.body.classList.remove("viewer-open");
}

closeViewer.addEventListener("click", hideViewer);
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) hideViewer();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !viewer.hidden) hideViewer();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installButton.classList.add("show");
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installButton.classList.remove("show");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

updateSaveStatus();
