// signatureProcessor.js
// Advanced signature enhancement utility for Greenvoltes CRM
// Removes background paper, boosts stroke contrast and vibrancy, and crops empty margins.

/**
 * Process a signature image from File, Blob, Data URL, or Image URL.
 * Automatically removes paper background, enhances ink brightness/vibrancy,
 * applies anti-aliasing, and crops empty margins.
 * 
 * @param {File|Blob|string} imageSource 
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
export const processSignatureImage = (imageSource) => {
  return new Promise((resolve) => {
    if (!imageSource) {
      resolve({ dataUrl: null, width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const handleLoad = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve({
            dataUrl: typeof imageSource === 'string' ? imageSource : null,
            width: 0,
            height: 0
          });
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Step 1: Analyze pixel luminance distribution and background
        const hist = new Int32Array(256);
        let validPixels = 0;
        let transparentPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 30) {
            transparentPixels++;
            continue;
          }
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          hist[lum]++;
          validPixels++;
        }

        // If image is already largely transparent (e.g. from a digital signature pad)
        const isAlreadyTransparent = transparentPixels > (data.length / 4) * 0.4;

        // Find ink luminance (5th percentile) and paper luminance (90th percentile)
        let count = 0;
        let inkLum = 0;
        let bgLum = 255;
        const p05 = Math.floor(validPixels * 0.05);
        const p90 = Math.floor(validPixels * 0.90);

        for (let l = 0; l < 256; l++) {
          count += hist[l];
          if (inkLum === 0 && count >= p05) {
            inkLum = l;
          }
          if (count >= p90) {
            bgLum = l;
            break;
          }
        }

        if (bgLum - inkLum < 20) {
          bgLum = 255;
          inkLum = 0;
        }

        const dynamicRange = Math.max(20, bgLum - inkLum);
        // The paper threshold is placed safely near the background paper to retain fine strokes
        const paperThreshold = isAlreadyTransparent 
          ? 250 
          : Math.min(bgLum - 8, inkLum + dynamicRange * 0.82);

        // Step 2: Detect ink color (Blue pen vs Black/Dark pen)
        let blueScore = 0;
        let strokeSamples = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 50) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum < inkLum + dynamicRange * 0.6) {
            strokeSamples++;
            // Typical blue pen has higher blue channel than red and green
            if (b > r + 10 || (b > g + 5 && b > r + 6)) {
              blueScore++;
            }
          }
        }

        const isBlueInk = strokeSamples > 15 && (blueScore / strokeSamples) > 0.35;

        // Step 3: Ink enhancement and background clearing
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const a = data[i + 3];

            if (a < 25) {
              data[i + 3] = 0;
              continue;
            }

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (!isAlreadyTransparent && lum >= paperThreshold) {
              // Background paper -> make completely transparent
              data[i + 3] = 0;
            } else {
              // Calculate normalized ink intensity (0 = edge/background, 1 = dense ink core)
              const rawFactor = isAlreadyTransparent
                ? (a / 255) * (1 - lum / 255)
                : Math.max(0, Math.min(1, (paperThreshold - lum) / (paperThreshold - inkLum)));

              // Apply contrast boost power curve:
              // Strengthens thin, faint lines into rich, bold, solid strokes
              const boosted = Math.min(1, Math.pow(rawFactor, 0.65) * 1.35);

              // Set alpha with smooth anti-aliased edge
              data[i + 3] = Math.round(Math.min(255, boosted * 255 * 1.25));

              if (isBlueInk) {
                // Vibrant, bright Royal Blue ink (matching official document signatures)
                // Core: #0b3aa8 (11, 58, 168), Edge: #1850c4 (24, 80, 196)
                data[i] = Math.round(11 + (1 - boosted) * 16);
                data[i + 1] = Math.round(58 + (1 - boosted) * 28);
                data[i + 2] = Math.round(168 + (1 - boosted) * 35);
              } else {
                // Deep, crisp dark black / charcoal ink
                data[i] = Math.round(16 + (1 - boosted) * 20);
                data[i + 1] = Math.round(16 + (1 - boosted) * 20);
                data[i + 2] = Math.round(20 + (1 - boosted) * 22);
              }

              // Update bounding box coordinates
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Step 4: Crop tightly to signature content with clean padding
        if (maxX > minX && maxY > minY) {
          const padding = 10;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropW = Math.min(width - cropX, (maxX - minX) + padding * 2);
          const cropH = Math.min(height - cropY, (maxY - minY) + padding * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          resolve({
            dataUrl: cropCanvas.toDataURL('image/png'),
            width: cropW,
            height: cropH
          });
        } else {
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width,
            height
          });
        }
      } catch (err) {
        console.error('Error in signature enhancement:', err);
        resolve({
          dataUrl: typeof imageSource === 'string' ? imageSource : null,
          width: 0,
          height: 0
        });
      }
    };

    img.onload = handleLoad;
    img.onerror = () => {
      resolve({
        dataUrl: typeof imageSource === 'string' ? imageSource : null,
        width: 0,
        height: 0
      });
    };

    if (imageSource instanceof File || imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        resolve({ dataUrl: null, width: 0, height: 0 });
      };
      reader.readAsDataURL(imageSource);
    } else if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      resolve({ dataUrl: null, width: 0, height: 0 });
    }
  });
};

/**
 * Converts a data URL to a File object for multipart form uploading.
 * 
 * @param {string} dataUrl 
 * @param {string} filename 
 * @returns {File}
 */
export const dataUrlToFile = (dataUrl, filename = 'enhanced_signature.png') => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
