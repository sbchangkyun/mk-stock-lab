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

export const exportCardAsPng = async (card: HTMLElement, baseFilename: string) => {
  const rect = card.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (!width || !height) {
    throw new Error('Card is not visible.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const blob = await toBlob(card, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    width,
    height,
    style: {
      background: '#ffffff',
      color: '#172033',
      margin: '0',
    },
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return !node.closest('[data-card-actions], [data-export-card], [data-expand-card]');
    },
  });

  if (!blob) {
    throw new Error('PNG export failed.');
  }

  const filename = `${sanitizeFilename(baseFilename) || 'mk-stock-lab-market-card'}-${todayStamp()}.png`;
  triggerDownload(blob, filename);
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

      const previousLabel = button.getAttribute('aria-label') || '이미지로 저장';
      button.disabled = true;
      button.setAttribute('aria-label', '이미지 저장 중');

      try {
        await exportCardAsPng(target, button.dataset.exportFilename || targetId || 'mk-stock-lab-market-card');
      } catch {
        window.alert('이미지 저장을 완료하지 못했습니다. Chrome에서 다시 시도해 주세요.');
      } finally {
        button.disabled = false;
        button.setAttribute('aria-label', previousLabel);
      }
    });
  });
};
