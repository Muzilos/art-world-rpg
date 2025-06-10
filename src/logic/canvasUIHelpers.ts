// logic/canvasUIHelpers.ts
import { wrapAndDrawText, getWrappedLines } from '../utils/gameLogic';

export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke: { color: string; width: number } | null = null
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.stroke();
  }
};

export const drawMenuButton = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  action: () => void,
  addClickable: (x: number, y: number, width: number, height: number, action: () => void) => void,
  mousePos: { x: number; y: number } | null,
  color = '#3B82F6',
  disabled = false
) => {
  const lineHeight = 20;
  ctx.font = 'bold 14px Noto Sans';
  const lines = getWrappedLines(ctx, text, width, ctx.font);
  const textHeight = lines.length * lineHeight;
  const textY = y + (height - textHeight) / 2 + lineHeight * 0.85;

  // Hover effect
  let isHovered = false;
  if (mousePos &&
    mousePos.x >= x && mousePos.x <= x + width &&
    mousePos.y >= y && mousePos.y <= y + height &&
    !disabled
  ) {
    isHovered = true;
  }

  const bgColor = disabled ? '#64748B' : isHovered ? '#2563EB' : color;
  const textColor = isHovered ? '#FACC15' : '#FFFFFF';

  drawRoundedRect(ctx, x, y, width, height, 5, bgColor);

  lines.forEach((line: string, i: number) => {
    wrapAndDrawText(ctx, line, x, textY + i * lineHeight, width, lineHeight, {
      fillStyle: textColor,
      font: 'bold 14px Noto Sans',
      textAlign: 'center' as CanvasTextAlign
    });
  });

  if (!disabled) {
    addClickable(x, y, width, height, action);
  }
};

export const drawMenuTitle = (
  ctx: CanvasRenderingContext2D,
  title: string,
  boxX: number,
  boxWidth: number,
  currentY: number,
  padding: number
): number => {
  wrapAndDrawText(ctx, title, boxX + padding, currentY + 10, boxWidth - padding * 2, 28, {
    fillStyle: '#A78BFA',
    font: 'bold 24px Noto Sans',
    textAlign: 'center' as CanvasTextAlign
  });
  return currentY + 45; // This matches your original behavior
};
