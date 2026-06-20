const exportStyleProperties = [
  'align-items',
  'background',
  'background-color',
  'border',
  'border-radius',
  'box-shadow',
  'color',
  'display',
  'flex-direction',
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'gap',
  'grid-template-columns',
  'height',
  'justify-content',
  'line-height',
  'margin',
  'max-width',
  'min-height',
  'opacity',
  'overflow',
  'padding',
  'position',
  'text-align',
  'text-transform',
  'transform',
  'width',
  'z-index',
];

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣._-]+/g, '-')
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

const inlineComputedStyles = (source: Element, clone: Element) => {
  const computed = window.getComputedStyle(source);
  const style = exportStyleProperties
    .map((property) => `${property}:${computed.getPropertyValue(property)}`)
    .join(';');
  clone.setAttribute('style', `${clone.getAttribute('style') || ''};${style}`);

  Array.from(source.children).forEach((sourceChild, index) => {
    const cloneChild = clone.children[index];
    if (cloneChild) inlineComputedStyles(sourceChild, cloneChild);
  });
};

export const exportCardAsPng = async (card: HTMLElement, baseFilename: string) => {
  const rect = card.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (!width || !height) {
    throw new Error('Card is not visible.');
  }

  const clone = card.cloneNode(true) as HTMLElement;
  inlineComputedStyles(card, clone);
  clone.querySelectorAll('[data-export-card]').forEach((button) => button.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image export failed.'));
    });
    image.src = svgUrl;
    await loaded;

    const canvas = document.createElement('canvas');
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas export is not available.');

    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('PNG export failed.'))), 'image/png');
    });

    const filename = `${sanitizeFilename(baseFilename) || 'mk-stock-lab-market-card'}-${todayStamp()}.png`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } finally {
    URL.revokeObjectURL(svgUrl);
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

      const previousLabel = button.getAttribute('aria-label') || '이미지로 저장';
      button.disabled = true;
      button.setAttribute('aria-label', '이미지 저장 중');

      try {
        await exportCardAsPng(target, button.dataset.exportFilename || targetId || 'mk-stock-lab-market-card');
      } catch {
        window.alert('이미지 저장을 완료하지 못했습니다. 브라우저 설정을 확인해 주세요.');
      } finally {
        button.disabled = false;
        button.setAttribute('aria-label', previousLabel);
      }
    });
  });
};
