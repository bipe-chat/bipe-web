// Image links marked data-lightbox (the brand page, /sobre/marca/) open the image large in a <dialog>
// on the page, with a download link, instead of leaving the page. Labels come from the link
// (data-download, data-close), so the copy stays in copy.ts. A click with a modifier key keeps the
// browser's default; Esc and a click outside the image close the dialog.

let dialog: HTMLDialogElement | undefined;

function open(link: HTMLAnchorElement) {
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML = '<div class="lightbox-bar"><a class="lightbox-download" download></a><button type="button" class="lightbox-close"></button></div><img alt="" />';
    dialog.addEventListener("click", (e) => {
      const t = e.target as Element;
      if (t === dialog || t.closest(".lightbox-close")) dialog?.close();
    });
    document.body.append(dialog);
  }
  const img = dialog.querySelector("img")!;
  // A landscape image (link-preview cards) fills the width; a portrait one the height.
  const thumb = link.querySelector("img");
  img.classList.toggle("wide", !!thumb && thumb.naturalWidth > thumb.naturalHeight);
  img.src = link.href;
  img.alt = thumb?.alt ?? "";
  const download = dialog.querySelector<HTMLAnchorElement>(".lightbox-download")!;
  download.href = link.href;
  download.textContent = link.dataset.download ?? "";
  dialog.querySelector(".lightbox-close")!.textContent = link.dataset.close ?? "";
  dialog.showModal();
}

export function runLightbox() {
  document.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-lightbox]");
    if (!link) return;
    e.preventDefault();
    open(link);
  });
}
