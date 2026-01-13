import { ManagementProduct } from '@/types/management';
import logoPrimePrint from '@/assets/logo-prime-print.png';
import logoCartaoNaPorta from '@/assets/logo-cartao-na-porta.png';

interface PriceBox {
  quantity: number;
  price: number;
  pricePerUnit: number;
  highlight?: boolean;
}

// Load image and return as HTMLImageElement
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Draw rounded rectangle
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Draw organic curved shape (top-left decoration)
const drawOrganicShape = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.4);
  gradient.addColorStop(0, '#FFD4B8');
  gradient.addColorStop(0.5, '#FFCAA8');
  gradient.addColorStop(1, 'rgba(255, 220, 200, 0)');
  
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(width * 0.35, 0, width * 0.4, height * 0.1, width * 0.3, height * 0.2);
  ctx.bezierCurveTo(width * 0.15, height * 0.35, 0, height * 0.25, 0, height * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// Wrap text into multiple lines
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Format currency
const formatPrice = (value: number): string => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Get available prices from product
const getAvailablePrices = (product: ManagementProduct): PriceBox[] => {
  const prices: PriceBox[] = [];
  
  const priceMap: { quantity: number; price: number | undefined }[] = [
    { quantity: 100, price: product.price_qty100 },
    { quantity: 200, price: product.price_qty200 },
    { quantity: 250, price: product.price_qty250 },
    { quantity: 500, price: product.price_qty500 },
    { quantity: 1000, price: product.price_qty1000 },
    { quantity: 2000, price: product.price_qty2000 },
  ];

  // Filter by available quantities if defined
  const availableQtys = product.available_quantities;
  
  priceMap.forEach(({ quantity, price }) => {
    if (price && price > 0) {
      // If available_quantities is defined, only include those quantities
      if (!availableQtys || availableQtys.includes(quantity)) {
        prices.push({
          quantity,
          price,
          pricePerUnit: price / quantity,
        });
      }
    }
  });

  // Sort by quantity
  prices.sort((a, b) => a.quantity - b.quantity);

  // Highlight the most popular (usually 500)
  const highlightIdx = prices.findIndex(p => p.quantity === 500);
  if (highlightIdx !== -1) {
    prices[highlightIdx].highlight = true;
  }

  // Limit to 4 boxes
  return prices.slice(0, 4);
};

// Get specs text
const getSpecsText = (product: ManagementProduct): string => {
  if (product.custom_specs && product.custom_specs.length > 0) {
    return product.custom_specs.join(' / ');
  }
  
  // Default specs
  if (product.category === 'adesivos') {
    return 'Papel Couchê 90g / Frente e Verso colorido';
  }
  return 'Papel Couchê 250g / Frente e Verso colorido';
};

// Get verniz text based on product
const getVernizText = (product: ManagementProduct): string => {
  if (product.category === 'adesivos') {
    return 'FRENTE E VERSO';
  }
  return 'VERNIZ TOTAL FRENTE';
};

export const generateProductPromoImage = async (
  product: ManagementProduct
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Canvas dimensions (9:16 vertical proportion)
  const WIDTH = 720;
  const HEIGHT = 1280;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Colors from spec
  const ORANGE_PRIMARY = '#F57C00';
  const TEAL = '#2E8B7A';
  const WHITE = '#FFFFFF';
  const BLACK = '#000000';
  const YELLOW_BADGE = '#FFC107';
  const BEIGE = '#F2EFEA';

  // === WHITE BACKGROUND ===
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // === ORGANIC DECORATIVE SHAPE (top-left) ===
  drawOrganicShape(ctx, WIDTH, HEIGHT);

  // === MARGIN ===
  const MARGIN = 40;
  const MAX_NAME_WIDTH = WIDTH - MARGIN * 2 - 40;

  // === TITLE BLOCK ===
  // Product name (black, bold, uppercase) - with text wrapping
  ctx.fillStyle = BLACK;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  
  const nameLines = wrapText(ctx, product.name.toUpperCase(), MAX_NAME_WIDTH);
  let currentY = 120;
  const lineHeight = 56;
  
  for (const line of nameLines) {
    ctx.fillText(line, WIDTH / 2, currentY);
    currentY += lineHeight;
  }
  
  // Adjust spacing after name lines
  const sizeY = currentY + 10;

  // Size (orange, extra bold, uppercase)
  ctx.fillStyle = ORANGE_PRIMARY;
  ctx.font = '900 56px Arial, sans-serif';
  ctx.fillText(product.size?.toUpperCase() || '', WIDTH / 2, sizeY);

  // Calculate dynamic card position based on title height
  const titleBlockHeight = (nameLines.length * lineHeight) + 80;

  // === GREEN BLOCK (central area) ===
  const cardX = MARGIN + 30;
  const cardY = 60 + titleBlockHeight; // Dynamic position based on title height
  const cardWidth = WIDTH - (MARGIN + 30) * 2;
  const cardHeight = 420;
  const cardRadius = 40;
  const borderWidth = 12;

  // Orange border
  ctx.fillStyle = ORANGE_PRIMARY;
  roundRect(ctx, cardX - borderWidth, cardY - borderWidth, cardWidth + borderWidth * 2, cardHeight + borderWidth * 2, cardRadius + borderWidth);
  ctx.fill();

  // Teal/green card
  ctx.fillStyle = TEAL;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.fill();

  // "RECORTE PADRÃO" text (top of block)
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RECORTE PADRÃO', WIDTH / 2, cardY + 55);

  // Product image in center of card
  const imgSize = 240;
  const imgX = WIDTH / 2 - imgSize / 2;
  const imgY = cardY + 80;

  if (product.image_url) {
    try {
      const productImg = await loadImage(product.image_url);

      // Draw image with rounded corners
      ctx.save();
      roundRect(ctx, imgX, imgY, imgSize, imgSize, 16);
      ctx.clip();

      // Calculate aspect ratio and center
      const aspectRatio = productImg.width / productImg.height;
      let drawWidth = imgSize;
      let drawHeight = imgSize;
      let drawX = imgX;
      let drawY = imgY;

      if (aspectRatio > 1) {
        drawHeight = imgSize / aspectRatio;
        drawY = imgY + (imgSize - drawHeight) / 2;
      } else {
        drawWidth = imgSize * aspectRatio;
        drawX = imgX + (imgSize - drawWidth) / 2;
      }

      // White/beige background for image
      ctx.fillStyle = BEIGE;
      ctx.fillRect(imgX, imgY, imgSize, imgSize);

      ctx.drawImage(productImg, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } catch (e) {
      // Draw placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      roundRect(ctx, imgX, imgY, imgSize, imgSize, 16);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText('Sem imagem', WIDTH / 2, imgY + imgSize / 2);
    }
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, imgX, imgY, imgSize, imgSize, 16);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Sem imagem', WIDTH / 2, imgY + imgSize / 2);
  }

  // Orange label with verniz text at bottom of card
  const vernizText = getVernizText(product);
  const labelWidth = 300;
  const labelHeight = 44;
  const labelX = WIDTH / 2 - labelWidth / 2;
  const labelY = cardY + cardHeight - 65;
  
  ctx.fillStyle = ORANGE_PRIMARY;
  roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 10);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText(vernizText, WIDTH / 2, labelY + 30);

  // === SPECS PILL ===
  const specsY = cardY + cardHeight + 35;
  const specsText = getSpecsText(product);
  const specsWidth = WIDTH - MARGIN * 2 - 40;
  const specsHeight = 48;
  const specsX = (WIDTH - specsWidth) / 2;

  ctx.fillStyle = ORANGE_PRIMARY;
  roundRect(ctx, specsX, specsY, specsWidth, specsHeight, specsHeight / 2);
  ctx.fill();
  ctx.fillStyle = BLACK;
  ctx.font = 'bold italic 18px Arial, sans-serif';
  ctx.fillText(specsText, WIDTH / 2, specsY + 32);

  // === PRICE BOXES ===
  const prices = getAvailablePrices(product);
  const boxY = specsY + 85;
  const boxWidth = 145;
  const boxHeight = 160;
  const boxGap = 12;
  const totalBoxesWidth = prices.length * boxWidth + (prices.length - 1) * boxGap;
  let boxStartX = (WIDTH - totalBoxesWidth) / 2;

  prices.forEach((priceBox, index) => {
    const x = boxStartX + index * (boxWidth + boxGap);

    // Box background (orange)
    ctx.fillStyle = ORANGE_PRIMARY;
    roundRect(ctx, x, boxY, boxWidth, boxHeight, 16);
    ctx.fill();

    // Highlight badge (yellow "+ PEDIDO")
    if (priceBox.highlight) {
      const badgeWidth = 100;
      const badgeHeight = 28;
      const badgeX = x + boxWidth / 2 - badgeWidth / 2;
      const badgeY = boxY - 14;
      
      ctx.fillStyle = YELLOW_BADGE;
      roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText('+ PEDIDO', x + boxWidth / 2, badgeY + 19);
    }

    // Quantity (large, bold, white)
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 52px Arial, sans-serif';
    ctx.fillText(priceBox.quantity.toString(), x + boxWidth / 2, boxY + 60);

    // "unidades" (smaller, white)
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('unidades', x + boxWidth / 2, boxY + 85);

    // Price value (highlighted, in white)
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(formatPrice(priceBox.price), x + boxWidth / 2, boxY + 130);

    // Price per unit (below box, smaller)
    ctx.fillStyle = BLACK;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(
      `(R$ ${formatPrice(priceBox.pricePerUnit)}/UND)`,
      x + boxWidth / 2,
      boxY + boxHeight + 22
    );
  });

  // === FOOTER WITH LOGOS ===
  const footerY = HEIGHT - 100;

  try {
    const [primePrintLogo, cartaoNaPortaLogo] = await Promise.all([
      loadImage(logoPrimePrint),
      loadImage(logoCartaoNaPorta),
    ]);

    const logoHeight = 55;
    const primePrintWidth = (primePrintLogo.width / primePrintLogo.height) * logoHeight;
    const cartaoWidth = (cartaoNaPortaLogo.width / cartaoNaPortaLogo.height) * logoHeight;
    const logoGap = 50;
    
    // Center both logos
    const totalLogosWidth = primePrintWidth + logoGap + cartaoWidth;
    const logosStartX = (WIDTH - totalLogosWidth) / 2;

    // Prime Print logo
    ctx.drawImage(primePrintLogo, logosStartX, footerY, primePrintWidth, logoHeight);

    // Small airplane/delivery icon between logos (dotted line with plane)
    const iconX = logosStartX + primePrintWidth + logoGap / 2;
    ctx.fillStyle = ORANGE_PRIMARY;
    ctx.beginPath();
    ctx.moveTo(iconX - 12, footerY + logoHeight / 2);
    ctx.lineTo(iconX + 12, footerY + logoHeight / 2);
    ctx.strokeStyle = ORANGE_PRIMARY;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Simple plane icon
    ctx.beginPath();
    ctx.moveTo(iconX + 8, footerY + logoHeight / 2 - 6);
    ctx.lineTo(iconX + 16, footerY + logoHeight / 2);
    ctx.lineTo(iconX + 8, footerY + logoHeight / 2 + 6);
    ctx.closePath();
    ctx.fill();

    // Cartão na Porta logo
    ctx.drawImage(cartaoNaPortaLogo, logosStartX + primePrintWidth + logoGap, footerY, cartaoWidth, logoHeight);
  } catch (e) {
    // Fallback: draw text
    ctx.fillStyle = ORANGE_PRIMARY;
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Prime Print', WIDTH / 2 - 90, footerY + 35);
    ctx.fillText('Cartão na Porta', WIDTH / 2 + 90, footerY + 35);
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
};

// Download the generated image
export const downloadProductPromoImage = async (
  product: ManagementProduct
): Promise<void> => {
  const blob = await generateProductPromoImage(product);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}-promo.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
