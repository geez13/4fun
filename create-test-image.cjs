const sharp = require('sharp');

async function createTestImage() {
  try {
    // Create a 400x300 test image with a solid color background
    const testImage = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 100, g: 150, b: 255 }
      }
    })
    .jpeg({ quality: 90 })
    .toFile('test-proper.jpg');
    
    console.log('✅ Test image created successfully:', testImage);
  } catch (error) {
    console.error('❌ Error creating test image:', error);
  }
}

createTestImage();
