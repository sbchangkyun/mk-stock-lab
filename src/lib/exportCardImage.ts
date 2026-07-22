import { toBlob } from 'html-to-image';

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

const todayStamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportCardAsPng = async (card: HTMLElement, baseFilename: string, requestedExportWidth?: number) => {
  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  // Use scrollWidth (full content width) and requested minimum — ensures
  // desktop-size output regardless of current viewport (mobile or desktop).
  const naturalWidth = Math.max(card.scrollWidth, Math.ceil(card.getBoundingClientRect().width));
  const exportWidth = requestedExportWidth && requestedExportWidth > naturalWidth
    ? requestedExportWidth
    : naturalWidth;

  if (!exportWidth || !card.scrollHeight) {
    throw new Error('Card is not visible.');
  }

  // Save inline styles that will be temporarily overridden
  const savedWidth = card.style.width;
  const savedMinWidth = card.style.minWidth;
  const savedMaxWidth = card.style.maxWidth;
  const savedOverflow = card.style.overflow;

  // Expand card to export width so all content is visible during capture
  card.classList.add('is-exporting-image');
  card.style.width = `${exportWidth}px`;
  card.style.minWidth = `${exportWidth}px`;
  card.style.maxWidth = 'none';
  card.style.overflow = 'visible';

  // Allow one frame for layout to recalculate after dimension change
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const captureHeight = card.scrollHeight;

  try {
    const blob = await toBlob(card, {
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: exportWidth,
      height: captureHeight,
      style: {
        background: '#ffffff',
        color: '#172033',
        margin: '0',
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return !node.closest('[data-card-actions], [data-export-card], [data-expand-card], [data-close-expanded-card]');
      },
    });

    if (!blob) {
      throw new Error('PNG export failed.');
    }

    const filename = `${sanitizeFilename(baseFilename) || 'mk-stock-lab-market-card'}-${todayStamp()}.png`;
    triggerDownload(blob, filename);
  } finally {
    // Always restore — even on error
    card.classList.remove('is-exporting-image');
    card.style.width = savedWidth;
    card.style.minWidth = savedMinWidth;
    card.style.maxWidth = savedMaxWidth;
    card.style.overflow = savedOverflow;
  }
};

export const setupCardImageExport = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-export-card]');
  buttons.forEach((button) => {
    if (button.dataset.exportReady === 'true') return;
    button.dataset.exportReady = 'true';

    button.addEventListener('click', async () => {
      const targetId = button.dataset.exportTarget;
      const target = targetId ? document.getElementById(targetId) : button.closest<HTMLElement>('[data-exportable-card]');
      if (!target) return;

      // data-export-width on button sets minimum desktop width for the capture
      const exportWidth = button.dataset.exportWidth ? parseInt(button.dataset.exportWidth, 10) : undefined;

      const previousLabel = button.getAttribute('aria-label') || '이미지로 저장';
      button.disabled = true;
      button.setAttribute('aria-label', '이미지 저장 중');

      try {
        await exportCardAsPng(target, button.dataset.exportFilename || targetId || 'mk-stock-lab-market-card', exportWidth);
      } catch {
        window.alert('이미지 저장을 완료하지 못했습니다. Chrome에서 다시 시도해 주세요.');
      } finally {
        button.disabled = false;
        button.setAttribute('aria-label', previousLabel);
      }
    });
  });
};
