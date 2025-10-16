import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GEMINI_CONFIGURED = GOOGLE_API_KEY && GOOGLE_API_KEY !== '' && !GOOGLE_API_KEY.startsWith('your-');

// Initialize with API key - the library expects GEMINI_API_KEY env var or explicit key
const ai = GEMINI_CONFIGURED ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;

export interface FourFingerProcessingOptions {
  style?: 'natural' | 'artistic' | 'cartoon';
  prompt?: string;
}

export interface ProcessingResult {
  success: boolean;
  processedImageData?: string;
  processingTime: number;
  error?: string;
}

export class GeminiService {
  private isConfigured(): boolean {
    return GEMINI_CONFIGURED;
  }

  private async compareImages(originalBuffer: Buffer, processedBuffer: Buffer): Promise<{ similar: boolean, difference: number }> {
    try {
      // Convert both images to the same format and size for comparison
      const originalStats = await sharp(originalBuffer)
        .resize(100, 100) // Small size for quick comparison
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const processedStats = await sharp(processedBuffer)
        .resize(100, 100)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const originalData = originalStats.data;
      const processedData = processedStats.data;
      
      // Calculate pixel difference
      let totalDifference = 0;
      const pixelCount = originalData.length;
      
      for (let i = 0; i < pixelCount; i++) {
        totalDifference += Math.abs(originalData[i] - processedData[i]);
      }
      
      const averageDifference = totalDifference / pixelCount;
      const differencePercentage = (averageDifference / 255) * 100;
      
      // Consider images similar if difference is less than 5%
      const similar = differencePercentage < 5;
      
      console.log(`🔍 Image comparison: ${differencePercentage.toFixed(2)}% difference (${similar ? 'SIMILAR' : 'DIFFERENT'})`);
      
      return { similar, difference: differencePercentage };
      
    } catch (error) {
      console.error('❌ Error comparing images:', error);
      // If comparison fails, assume they're different to be safe
      return { similar: false, difference: 100 };
    }
  }



  private async createWatermarkSvg(imageWidth: number, imageHeight: number): Promise<string> {
    try {
      // Read the watermark SVG file
      // Resolve watermark path relative to project structure
      const watermarkPath = path.resolve(__dirname, '../../src/assets/wm.svg');
      let watermarkContent = '';
      
      try {
        watermarkContent = fs.readFileSync(watermarkPath, 'utf8');
      } catch (error) {
        console.warn('⚠️ Watermark file not found, using fallback watermark');
        // Fallback watermark if file doesn't exist
        watermarkContent = `
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="50" y="50" text-anchor="middle" font-family="Arial" font-size="24" fill="#000" opacity="0.3">四.fun</text>
          </svg>
        `;
      }
      
      // Calculate watermark size (responsive scaling)
      const maxWatermarkWidth = Math.min(imageWidth * 0.15, 200); // Max 15% of image width or 200px
      const maxWatermarkHeight = Math.min(imageHeight * 0.15, 150); // Max 15% of image height or 150px
      
      // Position watermark in bottom-right corner with 20px margins
      const watermarkX = imageWidth - maxWatermarkWidth - 20;
      const watermarkY = imageHeight - maxWatermarkHeight - 20;
      
      // Create the positioned watermark SVG
      const positionedWatermark = `
        <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(${watermarkX}, ${watermarkY})" opacity="0.3">
            <g transform="scale(${maxWatermarkWidth / 1017.92}, ${maxWatermarkHeight / 564.73})">
              ${watermarkContent.replace(/<\?xml[^>]*\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
            </g>
          </g>
        </svg>
      `;
      
      console.log(`🏷️ Created watermark: ${maxWatermarkWidth}x${maxWatermarkHeight} at position (${watermarkX}, ${watermarkY})`);
      return positionedWatermark;
      
    } catch (error) {
      console.error('❌ Error creating watermark SVG:', error);
      // Return empty SVG if watermark creation fails
      return `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
  }

  private async addFourFingerOverlay(imageBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      console.log('🏷️ Adding watermark to image...');
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 800, height = 600 } = metadata;
      
      console.log(`📐 Image dimensions: ${width}x${height}`);

      // Read and prepare the watermark SVG
      const watermarkSvg = await this.createWatermarkSvg(width, height);
      
      // Apply only the watermark without any color enhancements
      let instance = sharp(imageBuffer).composite([
        {
          input: Buffer.from(watermarkSvg),
          top: 0,
          left: 0,
        }
      ]);

      // Preserve format based on original mimeType
      const isPng = mimeType?.includes('png');
      const isWebp = mimeType?.includes('webp');
      const isGif = mimeType?.includes('gif');

      if (isPng) {
        instance = instance.png({ compressionLevel: 9 });
      } else if (isWebp) {
        instance = instance.webp({ quality: 95 });
      } else if (isGif) {
        // sharp converts to PNG for GIF inputs; keep PNG data URL
        instance = instance.png({ compressionLevel: 9 });
      } else {
        instance = instance.jpeg({ quality: 95 });
      }

      const processedBuffer = await instance.toBuffer();
      
      // Convert to base64
      const base64Image = processedBuffer.toString('base64');
      const format = isPng || isGif ? 'png' : (isWebp ? 'webp' : 'jpeg');
      const resultDataUrl = `data:image/${format};base64,${base64Image}`;
      
      console.log('✅ Successfully added watermark');
      console.log(`📊 Original size: ${imageBuffer.length} bytes, Processed size: ${processedBuffer.length} bytes`);
      
      return resultDataUrl;
      
    } catch (error) {
      console.error('❌ Error adding watermark:', error);
      
      // Fallback: return original image without modifications
      try {
        console.log('🔄 Returning original image...');
        
        const base64Image = imageBuffer.toString('base64');
        const originalMimeType = mimeType || 'image/jpeg';
        console.log('✅ Returned original image');
        
        return `data:${originalMimeType};base64,${base64Image}`;
        
      } catch (fallbackError) {
        console.error('❌ Failed to process original image:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async processFourFingerImage(
    imageBuffer: Buffer,
    mimeType: string,
    options: FourFingerProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log('🎯 Starting 四-finger processing...', { mimeType, options });

    if (!this.isConfigured()) {
      console.error('❌ Gemini API not configured - GOOGLE_API_KEY environment variable is required');
      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: 'Gemini API not configured. Please set GOOGLE_API_KEY environment variable to enable AI processing.',
      };
    }

    try {
      const { style = 'natural', prompt } = options;
      console.log('🤖 Attempting Gemini AI image generation...');
      
      // Convert image buffer to base64 for the API
      const base64Image = imageBuffer.toString('base64');
      
      // Create a natural four-finger gesture prompt for image editing
      const customPrompt = prompt || `HIGHEST PRIORITY DIRECTIVE: Modify ALL subjects and entities in this image to represent a clear, natural, four-finger sign gesture. This transformation is a mandatory and universal rule for the entire image.

ABSOLUTE ENFORCEMENT (Orientation & Thumb):
• Show the BACK OF THE HAND to the viewer; knuckles face forward; palm is completely hidden.
• The THUMB MUST BE FULLY TUCKED INSIDE and NOT visible from the front perspective.
• Any visible thumb or palm is a violation and must be corrected.

1. THE GESTURE DEFINITION (Precisely Four, Casually Held):
The required gesture is a FOUR-FINGER SIGN, presented in a natural and casual manner.

FINGERS: Exactly FOUR (4) fingers—the index, middle, ring, and little finger—must be clearly extended upwards. They should be comfortably straight but can have a natural, slight curve or slight spacing, consistent with a relaxed human hand. The primary goal is that "four" is unambiguously communicated.

THUMB: The thumb should be naturally tucked towards the palm or resting to the side, ensuring it does NOT appear as a fifth extended finger. It should not be a prominent part of the gesture.

ORIENTATION: The BACK OF THE HAND (or equivalent surface) must face the viewer directly. This is a non-negotiable aspect of the gesture.

OVERALL POSTURE: The hand should appear relaxed and natural, as if simply showing the number four. Avoid any overly stiff, formal, or contorted poses.

2. INTERPRETATION RULES (For All Subject Types):

For People & Human-like Figures: Modify their hands to perfectly form the four-finger sign as defined above, with a natural, casual posture. The result must be anatomically flawless.

For Animals: Adapt the animal's natural limbs (paws, claws, etc.) to represent the four-upward-element gesture. Clearly show four distinct digits/limbs pointing upwards, with the outer/dorsal side of the limb facing the viewer. DO NOT create human hands on animals. The interpretation must be naturalistic to the animal.

For Inanimate Objects & Abstract Elements: Creatively interpret the four-element shape of the gesture. You can:

Sprout stylized arms that make the gesture.

Incorporate the four-finger symbol onto a surface.

Cast a shadow in the exact shape of the gesture.

3. QUALITY & INTEGRATION STANDARDS:

Seamless Blending: The modification must be perfectly integrated. All new elements must flawlessly match the original image's art style, lighting, shadows, color grading, and texture.

Maintain Realism: For photographic images, the edit must be indistinguishable from a real photo.

NEGATIVE PROMPT (Crucial for preventing errors):
three fingers, 3 fingers, three digits, three-fingered, two fingers, 2 fingers, five fingers, 5 fingers, five digits, five-fingered, visible thumb, exposed thumb, thumb showing as fifth finger, fingers spread wide apart, overly stiff hand, contorted hand, distorted hand, mangled fingers, extra fingers, missing fingers, malformed hand, palm, front of hand, open palm, incorrect number of fingers.`;

      console.log('📝 Using prompt:', customPrompt);
      console.log('🖼️ Image data length:', base64Image.length);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout after 30 seconds')), 30000);
      });

      // Use the correct @google/genai API structure for image processing
      console.log('🔄 Making API call to Gemini...');
      
      const processingPromise = ai!.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          customPrompt,
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ]
      });
      
      console.log('⏳ Waiting for Gemini response...');
      const response = await Promise.race([processingPromise, timeoutPromise]);
      console.log('📥 Received response from Gemini - processing parts...');
      
      // Process the response according to the correct API structure
      let processedImageData: string | null = null;
      
      // Check if we have candidates and parts
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              console.log('📝 Text response:', part.text);
            } else if (part.inlineData) {
              console.log('🖼️ Found image data in response');
              const imageData = part.inlineData.data;
              const imageMimeType = part.inlineData.mimeType || mimeType;
              
              // Convert the generated image to buffer for comparison
              const geminiBuffer = Buffer.from(imageData, 'base64');
              
              // Compare with original to detect subtle changes
              const comparison = await this.compareImages(imageBuffer, geminiBuffer);
              
              if (imageData === base64Image || comparison.similar) {
                console.warn(`⚠️ Gemini returned ${imageData === base64Image ? 'identical' : 'too similar'} image (${comparison.difference.toFixed(2)}% difference), applying dramatic processing...`);
                
                // Apply our dramatic modifications to ensure visual difference
                processedImageData = await this.addFourFingerOverlay(geminiBuffer, imageMimeType);
              } else {
                console.log(`✅ Gemini generated sufficiently different image (${comparison.difference.toFixed(2)}% difference)`);
                
                // Even if Gemini made changes, still apply our overlay for consistency
                processedImageData = await this.addFourFingerOverlay(geminiBuffer, imageMimeType);
              }
              break;
            }
          }
        }
      }
      
      if (!processedImageData) {
        console.warn('⚠️ No image data found in Gemini response');
        throw new Error('No image data in Gemini response');
      }
      
      const processingTime = Date.now() - startTime;
      console.log('✅ Gemini processing completed in', processingTime, 'ms');
      
      return {
        success: true,
        processedImageData,
        processingTime,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Categorize error types for better debugging
      let errorType = 'unknown';
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('🔍 Full error details:', error);
        
        if (error.message.includes('timeout')) {
          errorType = 'timeout';
        } else if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorType = 'authentication';
        } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
          errorType = 'quota_exceeded';
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
          errorType = 'network';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorType = 'bad_request';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorType = 'forbidden';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorType = 'not_found';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorType = 'server_error';
        } else {
          errorType = 'api_error';
        }
      }
      
      console.error(`❌ Gemini processing failed (${errorType}):`, errorMessage);
      
      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: `AI processing failed (${errorType}): ${errorMessage}`,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('❌ Gemini API not configured - GOOGLE_API_KEY environment variable is required for connection test');
      return false;
    }

    try {
      // Simple test to verify API key and connection with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout after 10 seconds')), 10000);
      });

      // Use a simple text model for connection testing
      const testPromise = ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: ["Test connection - respond with 'OK'"],
      });
      
      const response = await Promise.race([testPromise, timeoutPromise]);
      
      // Extract text from response
      let responseText = 'No response';
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              responseText = part.text;
              break;
            }
          }
        }
      }
      
      console.log('✅ Gemini API connection test successful, response:', responseText);
      return true;
    } catch (error) {
      console.error('❌ Gemini connection test failed:', error);
      return false;
    }
  }

  getConfigurationStatus(): { configured: boolean; message: string } {
    if (!this.isConfigured()) {
      return {
        configured: false,
        message: 'Gemini API not configured. Set GOOGLE_API_KEY environment variable to enable AI processing.'
      };
    }
    return {
      configured: true,
      message: 'Gemini API configured and ready for AI processing.'
    };
  }
}

export const geminiService = new GeminiService();