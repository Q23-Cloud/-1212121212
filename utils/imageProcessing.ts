export const processImageToPolaroid = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Output dimensions
        const cardWidth = 500;
        const cardHeight = 600;
        const photoSize = 440; // Square photo area
        const topPadding = 30;
        
        canvas.width = cardWidth;
        canvas.height = cardHeight;

        // Draw Polaroid Background (White/Paper)
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, cardWidth, cardHeight);
        
        // Add subtle texture/noise (optional simple grain)
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(0, 0, cardWidth, cardHeight);

        // Calculate aspect ratio fit for the image inside the photo area
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        // Center crop strategy
        if (sWidth > sHeight) {
          sWidth = sHeight;
          sx = (img.width - sHeight) / 2;
        } else {
          sHeight = sWidth;
          sy = (img.height - sWidth) / 2;
        }

        // Draw the user photo
        const photoX = (cardWidth - photoSize) / 2;
        const photoY = topPadding;
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, photoX, photoY, photoSize, photoSize);
        
        // Add inner shadow to photo cutout
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(photoX, photoY, photoSize, photoSize);

        // Add Signature Text at bottom
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText("Arix Signature Collection", cardWidth / 2, cardHeight - 35);
        
        ctx.font = 'italic 16px "Times New Roman", serif';
        ctx.fillStyle = '#666';
        ctx.fillText("Christmas 2024", cardWidth / 2, cardHeight - 15);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
