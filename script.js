import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const pdfInput = document.getElementById("pdfInput");
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

const rowMarker = document.getElementById("rowMarker");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

let markerTop = 50;

pdfInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);

    pdfDoc = await pdfjsLib.getDocument(typedArray).promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;

    await renderPage(currentPage);
  };

  fileReader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber) {
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 1.5 });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;

  pageInfo.textContent = `${currentPage} / ${totalPages}`;

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

function moveMarker(amount) {
  markerTop += amount;

  if (markerTop < 0) markerTop = 0;
  if (markerTop > 100) markerTop = 100;

  updateMarker();
}

function updateMarker() {
  rowMarker.style.top = `${markerTop}%`;
}
