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
const verticalMarker1 = document.getElementById("verticalMarker1");
const verticalMarker2 = document.getElementById("verticalMarker2");
const verticalModeButtons = document.querySelectorAll(".vertical-mode-button");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

let markerTop = 50;
let pdfScale = 1.5;
let rowHeight = 18;

let verticalMode = 0; // 0 = 없음, 1 = 1줄, 2 = 2줄
let verticalMarker1Left = 35; // percent
let verticalMarker2Left = 65; // percent
let activeVerticalMarker = null;

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
    verticalMode = 0;
    verticalMarker1Left = 35;
    verticalMarker2Left = 65;

    await renderPage(currentPage);
  };

  fileReader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber) {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: pdfScale });

  const outputScale = window.devicePixelRatio || 1;

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const transform = outputScale !== 1
    ? [outputScale, 0, 0, outputScale, 0, 0]
    : null;

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    transform: transform
  }).promise;

  pageInfo.textContent = `${currentPage} / ${totalPages}`;

  if (zoomInfo) {
    zoomInfo.textContent = `${Math.round(pdfScale * 100)}%`;
  }

  updateMarker();
  updateVerticalMarkers();
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


document.getElementById("nudgeUp").addEventListener("click", () => {
  nudgeMarker(-1);
});

document.getElementById("nudgeDown").addEventListener("click", () => {
  nudgeMarker(1);
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


verticalModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setVerticalMode(Number(button.dataset.verticalMode));
  });
});

setupVerticalMarkerDrag(verticalMarker1, 1);
setupVerticalMarkerDrag(verticalMarker2, 2);


function moveMarker(rowCount) {
  const canvasHeight = canvas.clientHeight;

  if (!canvasHeight) return;

  const movePercent = (rowHeight * rowCount / canvasHeight) * 100;

  markerTop += movePercent;

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


function nudgeMarker(pixelAmount) {
  const canvasHeight = canvas.clientHeight;

  if (!canvasHeight) return;

  const movePercent = (pixelAmount / canvasHeight) * 100;

  markerTop += movePercent;

  if (markerTop < 0) {
    markerTop = 0;
  }

  if (markerTop > 100) {
    markerTop = 100;
  }

  updateMarker();
}





function setVerticalMode(mode) {
  verticalMode = mode;
  updateVerticalMarkers();
}

function updateVerticalMarkers() {
  if (!verticalMarker1 || !verticalMarker2) return;

  verticalMarker1.style.display = verticalMode >= 1 ? "block" : "none";
  verticalMarker2.style.display = verticalMode >= 2 ? "block" : "none";

  verticalMarker1.style.left = `calc(${verticalMarker1Left}% - ${verticalMarker1.offsetWidth / 2}px)`;
  verticalMarker2.style.left = `calc(${verticalMarker2Left}% - ${verticalMarker2.offsetWidth / 2}px)`;

  verticalModeButtons.forEach((button) => {
    const isActive = Number(button.dataset.verticalMode) === verticalMode;
    button.classList.toggle("active", isActive);
  });
}

function setupVerticalMarkerDrag(marker, markerNumber) {
  if (!marker) return;

  marker.addEventListener("pointerdown", (event) => {
    if (!canvas.clientWidth) return;

    activeVerticalMarker = markerNumber;
    marker.setPointerCapture(event.pointerId);
    moveVerticalMarker(event, markerNumber);
  });

  marker.addEventListener("pointermove", (event) => {
    if (activeVerticalMarker !== markerNumber) return;

    moveVerticalMarker(event, markerNumber);
  });

  marker.addEventListener("pointerup", (event) => {
    if (activeVerticalMarker !== markerNumber) return;

    activeVerticalMarker = null;
    marker.releasePointerCapture(event.pointerId);
  });

  marker.addEventListener("pointercancel", () => {
    if (activeVerticalMarker === markerNumber) {
      activeVerticalMarker = null;
    }
  });
}

function moveVerticalMarker(event, markerNumber) {
  const rect = canvas.getBoundingClientRect();

  if (!rect.width) return;

  let leftPercent = ((event.clientX - rect.left) / rect.width) * 100;

  if (leftPercent < 0) {
    leftPercent = 0;
  }

  if (leftPercent > 100) {
    leftPercent = 100;
  }

  if (markerNumber === 1) {
    verticalMarker1Left = leftPercent;
  }

  if (markerNumber === 2) {
    verticalMarker2Left = leftPercent;
  }

  updateVerticalMarkers();
}
