const { Jimp } = require('jimp');

async function processImage(inPath, outPath) {
  try {
    const img = await Jimp.read(inPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    const r = Math.round(w * 0.225);
    
    img.scan(0, 0, w, h, function(x, y, idx) {
      let isOutside = false;
      
      if (x < r && y < r) {
        if (Math.pow(r - x, 2) + Math.pow(r - y, 2) > Math.pow(r, 2)) isOutside = true;
      } else if (x >= w - r && y < r) {
        if (Math.pow(x - (w - r), 2) + Math.pow(r - y, 2) > Math.pow(r, 2)) isOutside = true;
      } else if (x < r && y >= h - r) {
        if (Math.pow(r - x, 2) + Math.pow(y - (h - r), 2) > Math.pow(r, 2)) isOutside = true;
      } else if (x >= w - r && y >= h - r) {
        if (Math.pow(x - (w - r), 2) + Math.pow(y - (h - r), 2) > Math.pow(r, 2)) isOutside = true;
      }
      
      if (isOutside) {
        this.bitmap.data[idx + 3] = 0;
      }
    });
    
    await img.write(outPath);
    console.log('Processed', outPath);
  } catch (err) {
    console.error('Error:', err);
  }
}

async function run() {
  await processImage('/home/manudev/.gemini/antigravity/brain/77d1fa39-ae89-4ffc-914c-fa0c4860e6c1/media__1773897064511.jpg', '/home/manudev/.gemini/antigravity/brain/77d1fa39-ae89-4ffc-914c-fa0c4860e6c1/icon_dark_transparent.png');
  await processImage('/home/manudev/.gemini/antigravity/brain/77d1fa39-ae89-4ffc-914c-fa0c4860e6c1/media__1773897073142.jpg', '/home/manudev/.gemini/antigravity/brain/77d1fa39-ae89-4ffc-914c-fa0c4860e6c1/icon_light_transparent.png');
}

run();
