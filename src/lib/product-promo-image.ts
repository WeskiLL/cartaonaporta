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
    return 'Couchê 90g / Frente e Verso colorido';
  }
  return 'Papel Couche 250g / Frente e Verso colorido';
};

export const generateProductPromoImage = async (
  product: ManagementProduct
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Canvas dimensions (similar to reference image proportions)
  const WIDTH = 800;
  const HEIGHT = 1200;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Colors
  const ORANGE_PRIMARY = '#e85616';
  const ORANGE_SECONDARY = '#ee7e1a';
  const TEAL = '#2a9d8f';
  const WHITE = '#ffffff';
  const DARK = '#1a1a1a';

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  gradient.addColorStop(0, WHITE);
  gradient.addColorStop(0.7, '#fff5f0');
  gradient.addColorStop(1, '#ffd4c4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // === TITLE (Product Name) ===
  ctx.fillStyle = ORANGE_PRIMARY;
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(product.name.toUpperCase(), WIDTH / 2, 70);

  // === SIZE ===
  ctx.fillStyle = ORANGE_SECONDARY;
  ctx.font = 'bold italic 42px Arial, sans-serif';
  ctx.fillText(product.size?.toUpperCase() || '', WIDTH / 2, 125);

  // === TEAL CARD BACKGROUND ===
  const cardX = 50;
  const cardY = 160;
  const cardWidth = WIDTH - 100;
  const cardHeight = 380;
  
  // Orange border
  ctx.fillStyle = ORANGE_SECONDARY;
  roundRect(ctx, cardX - 6, cardY - 6, cardWidth + 12, cardHeight + 12, 30);
  ctx.fill();
  
  // Teal card
  ctx.fillStyle = TEAL;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
  ctx.fill();

  // "RECORTE PADRÃO" text
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RECORTE PADRÃO', WIDTH / 2, cardY + 45);

  // Product image in center of card
  const imgSize = 200;
  const imgX = WIDTH / 2 - imgSize / 2;
  const imgY = cardY + 70;
  
  if (product.image_url) {
    try {
      const productImg = await loadImage(product.image_url);
      
      // Draw image with rounded corners
      ctx.save();
      roundRect(ctx, imgX, imgY, imgSize, imgSize, 12);
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
      
      // White background for image
      ctx.fillStyle = WHITE;
      ctx.fillRect(imgX, imgY, imgSize, imgSize);
      
      ctx.drawImage(productImg, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } catch (e) {
      // Draw placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      roundRect(ctx, imgX, imgY, imgSize, imgSize, 12);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText('Sem imagem', WIDTH / 2, imgY + imgSize / 2);
    }
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, imgX, imgY, imgSize, imgSize, 12);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('Sem imagem', WIDTH / 2, imgY + imgSize / 2);
  }

  // "VERNIZ TOTAL FRENTE" label at bottom of card
  const labelY = cardY + cardHeight - 50;
  ctx.fillStyle = ORANGE_SECONDARY;
  roundRect(ctx, WIDTH / 2 - 140, labelY, 280, 40, 8);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('VERNIZ TOTAL FRENTE', WIDTH / 2, labelY + 27);

  // === SPECS TEXT ===
  const specsY = cardY + cardHeight + 45;
  ctx.fillStyle = TEAL;
  roundRect(ctx, 80, specsY, WIDTH - 160, 40, 6);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText(getSpecsText(product), WIDTH / 2, specsY + 26);

  // === PRICE BOXES ===
  const prices = getAvailablePrices(product);
  const boxY = specsY + 80;
  const boxWidth = 160;
  const boxHeight = 140;
  const boxGap = 15;
  const totalBoxesWidth = prices.length * boxWidth + (prices.length - 1) * boxGap;
  let boxStartX = (WIDTH - totalBoxesWidth) / 2;

  prices.forEach((priceBox, index) => {
    const x = boxStartX + index * (boxWidth + boxGap);
    
    // Box background
    ctx.fillStyle = ORANGE_SECONDARY;
    roundRect(ctx, x, boxY, boxWidth, boxHeight, 12);
    ctx.fill();

    // Highlight badge
    if (priceBox.highlight) {
      ctx.fillStyle = '#16a34a';
      roundRect(ctx, x + boxWidth / 2 - 45, boxY - 15, 90, 30, 6);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('+ PEDIDO', x + boxWidth / 2, boxY + 5);
    }

    // Quantity
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(priceBox.quantity.toString(), x + boxWidth / 2, boxY + 55);
    
    // "unidades"
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('unidades', x + boxWidth / 2, boxY + 75);

    // Price
    ctx.fillStyle = '#1a3d34';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText(formatPrice(priceBox.price), x + boxWidth / 2, boxY + 115);

    // Price per unit (below box)
    ctx.fillStyle = ORANGE_PRIMARY;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(
      `(R$ ${formatPrice(priceBox.pricePerUnit)}/UND)`,
      x + boxWidth / 2,
      boxY + boxHeight + 25
    );
  });

  // === LOGOS ===
  const logosY = HEIGHT - 100;
  
  try {
    const [primePrintLogo, cartaoNaPortaLogo] = await Promise.all([
      loadImage(logoPrimePrint),
      loadImage(logoCartaoNaPorta),
    ]);

    // Prime Print logo
    const logoHeight = 50;
    const primePrintWidth = (primePrintLogo.width / primePrintLogo.height) * logoHeight;
    ctx.drawImage(primePrintLogo, WIDTH / 2 - primePrintWidth - 30, logosY, primePrintWidth, logoHeight);

    // Cartão na Porta logo
    const cartaoWidth = (cartaoNaPortaLogo.width / cartaoNaPortaLogo.height) * logoHeight;
    ctx.drawImage(cartaoNaPortaLogo, WIDTH / 2 + 30, logosY, cartaoWidth, logoHeight);
  } catch (e) {
    // Fallback: draw text
    ctx.fillStyle = ORANGE_PRIMARY;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Prime Print', WIDTH / 2 - 80, logosY + 30);
    ctx.fillText('Cartão na Porta', WIDTH / 2 + 80, logosY + 30);
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
      0.92
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
