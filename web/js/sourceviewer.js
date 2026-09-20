/**
 * Source Code Viewer Module.
 * Displays key Python simulation files with syntax highlighting.
 */

import { Api } from "./api.js";

export function initSourceViewer() {
  const fileItems = document.querySelectorAll(".file-item");
  fileItems.forEach((item) => {
    item.addEventListener("click", async () => {
      fileItems.forEach((f) => f.classList.remove("active"));
      item.classList.add("active");
      const filename = item.getAttribute("data-file");
      await loadSourceFile(filename);
    });
  });

  // Load first file by default
  loadSourceFile("config.py");
}

async function loadSourceFile(filename) {
  const titleEl = document.getElementById("code-filename-title");
  const displayEl = document.getElementById("code-display");
  if (titleEl) titleEl.textContent = filename;
  if (displayEl) displayEl.textContent = "# Loading module source...";

  try {
    const code = await Api.fetchSourceCode(filename);
    if (displayEl) {
      displayEl.textContent = code;
      if (window.Prism) {
        Prism.highlightElement(displayEl);
      }
    }
  } catch (err) {
    if (displayEl) displayEl.textContent = `# Error loading ${filename}`;
  }
}
