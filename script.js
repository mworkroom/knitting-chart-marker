import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const pdfInput = document.getElementById("pdfInput");
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

const zoomOutButton = document.getElementById("zoomOut");
const zoomInButton = document.getElementById("zoomIn");
const zoomInfo = document.getElementById("zoomInfo");

const rowMarker = document.getElementById("rowMarker");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

let markerTop = 50;
let pdfScale = 1.5;
let rowHeight = 18;

pdfInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);

    pdfDoc = await pdfjsLib.getDocument(typedArray).promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;
    markerTop = 50;
    rowHeight = 18;
    pdfScale = 1.5;

    await renderPage(currentPage);
  };

  fileReader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber) {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: pdfScale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;

  pageInfo.textContent = `${currentPage} / ${totalPages}`;

  if (zoomInfo) {
    zoomInfo.textContent = `${Math.round(pdfScale * 100)}%`;
  }

  updateMarker();
}

prevPageButton.addEventListener("click", async () => {
  if (!pdfDoc || currentPage <= 1) return;

  currentPage--;
  await renderPage(currentPage);
});

nextPageButton.addEventListener("click", async () => {
  if (!pdfDoc || currentPage >= totalPages) return;

  currentPage++;
  await renderPage(currentPage);
});

if (zoomOutButton) {
  zoomOutButton.addEventListener("click", async () => {
    if (!pdfDoc) return;

    pdfScale -= 0.25;

    if (pdfScale < 0.75) {
      pdfScale = 0.75;
    }

    await renderPage(currentPage);
  });
}

if (zoomInButton) {
  zoomInButton.addEventListener("click", async () => {
    if (!pdfDoc) return;

    pdfScale += 0.25;

    if (pdfScale > 4) {
      pdfScale = 4;
    }

    await renderPage(currentPage);
  });
}

document.getElementById("upSmall").addEventListener("click", () => {
  moveMarker(-1);
});

document.getElementById("downSmall").addEventListener("click", () => {
  moveMarker(1);
});

document.getElementById("upLarge").addEventListener("click", () => {
  moveMarker(-5);
});

document.getElementById("downLarge").addEventListener("click", () => {
  moveMarker(5);
});

document.querySelectorAll(".color-button").forEach((button) => {
  button.addEventListener("click", () => {
    setMarkerColor(button.dataset.color);
  });
});

document.getElementById("heightDown").addEventListener("click", () => {
  changeMarkerHeight(-2);
});

document.getElementById("heightUp").addEventListener("click", () => {
  changeMarkerHeight(2);
});


function moveMarker(amount) {
  markerTop += amount;

  if (markerTop < 0) {
    markerTop = 0;
  }

  if (markerTop > 100) {
    markerTop = 100;
  }

  updateMarker();
}

function updateMarker() {
  rowMarker.style.top = `${markerTop}%`;
  rowMarker.style.height = `${rowHeight}px`;
}

function setMarkerColor(color) {
  const colors = {
    yellow: "rgba(255, 230, 120, 0.45)",
    blue: "rgba(96, 165, 250, 0.40)",
    pink: "rgba(244, 114, 182, 0.38)",
    green: "rgba(74, 222, 128, 0.38)",
    gray: "rgba(156, 163, 175, 0.40)"
  };

  rowMarker.style.background = colors[color] || colors.blue;
}


const markerControls = document.querySelector(".marker-controls");

function updateFloatingControlsPosition() {
  if (!markerControls || !window.visualViewport) return;

  const viewport = window.visualViewport;

  markerControls.style.position = "fixed";
  markerControls.style.right = "auto";
  markerControls.style.left = `${viewport.offsetLeft + viewport.width - markerControls.offsetWidth - 12}px`;
  markerControls.style.top = `${viewport.offsetTop + viewport.height / 2}px`;
  markerControls.style.transform = "translateY(-50%)";
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateFloatingControlsPosition);
  window.visualViewport.addEventListener("scroll", updateFloatingControlsPosition);
}

window.addEventListener("load", updateFloatingControlsPosition);
window.addEventListener("resize", updateFloatingControlsPosition);


function changeMarkerHeight(amount) {
  rowHeight += amount;

  if (rowHeight < 6) {
    rowHeight = 6;
  }

  if (rowHeight > 80) {
    rowHeight = 80;
  }

  updateMarker();
}
