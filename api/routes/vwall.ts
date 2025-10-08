import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';

const router = Router();

// Demo images for when database is empty or not configured
const getDemoImages = (limit: number) => {
  const demoImages = [
    {
      id: 'demo-1',
      image_url: 'https://picsum.photos/400/600?random=1',
      thumbnail_url: 'https://picsum.photos/400/600?random=1',
      optimized_url: 'https://picsum.photos/400/600?random=1',
      aspect_ratio: 0.67,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      prompt: 'Beautiful landscape with mountains and lakes',
      style: 'photorealistic',
      owner_pubkey: 'demo-wallet-1',
      wallet_address: 'demo-wallet-1',
      source: 'demo'
    },
    {
      id: 'demo-2',
      image_url: 'https://picsum.photos/400/400?random=2',
      thumbnail_url: 'https://picsum.photos/400/400?random=2',
      optimized_url: 'https://picsum.photos/400/400?random=2',
      aspect_ratio: 1.0,
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      prompt: 'Abstract digital art with vibrant colors',
      style: 'abstract',
      owner_pubkey: 'demo-wallet-2',
      wallet_address: 'demo-wallet-2',
      source: 'demo'
    },
    {
      id: 'demo-3',
      image_url: 'https://picsum.photos/400/500?random=3',
      thumbnail_url: 'https://picsum.photos/400/500?random=3',
      optimized_url: 'https://picsum.photos/400/500?random=3',
      aspect_ratio: 0.8,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      prompt: 'Futuristic cityscape at sunset',
      style: 'sci-fi',
      owner_pubkey: 'demo-wallet-3',
      wallet_address: 'demo-wallet-3',
      source: 'demo'
    },
    {
      id: 'demo-4',
      image_url: 'https://picsum.photos/400/700?random=4',
      thumbnail_url: 'https://picsum.photos/400/700?random=4',
      optimized_url: 'https://picsum.photos/400/700?random=4',
      aspect_ratio: 0.57,
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      prompt: 'Portrait of a mysterious character',
      style: 'portrait',
      owner_pubkey: 'demo-wallet-4',
      wallet_address: 'demo-wallet-4',
      source: 'demo'
    },
    {
      id: 'demo-5',
      image_url: 'https://picsum.photos/400/450?random=5',
      thumbnail_url: 'https://picsum.photos/400/450?random=5',
      optimized_url: 'https://picsum.photos/400/450?random=5',
      aspect_ratio: 0.89,
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      prompt: 'Magical forest with glowing elements',
      style: 'fantasy',
      owner_pubkey: 'demo-wallet-5',
      wallet_address: 'demo-wallet-5',
      source: 'demo'
    },
    {
      id: 'demo-6',
      image_url: 'https://picsum.photos/400/550?random=6',
      thumbnail_url: 'https://picsum.photos/400/550?random=6',
      optimized_url: 'https://picsum.photos/400/550?random=6',
      aspect_ratio: 0.73,
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      prompt: 'Ocean waves crashing on rocky shore',
      style: 'nature',
      owner_pubkey: 'demo-wallet-6',
      wallet_address: 'demo-wallet-6',
      source: 'demo'
    },
    {
      id: 'demo-7',
      image_url: 'https://picsum.photos/400/480?random=7',
      thumbnail_url: 'https://picsum.photos/400/480?random=7',
      optimized_url: 'https://picsum.photos/400/480?random=7',
      aspect_ratio: 0.83,
      created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      prompt: 'Steampunk mechanical contraption',
      style: 'steampunk',
      owner_pubkey: 'demo-wallet-7',
      wallet_address: 'demo-wallet-7',
      source: 'demo'
    },
    {
      id: 'demo-8',
      image_url: 'https://picsum.photos/400/620?random=8',
      thumbnail_url: 'https://picsum.photos/400/620?random=8',
      optimized_url: 'https://picsum.photos/400/620?random=8',
      aspect_ratio: 0.65,
      created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
      prompt: 'Space exploration scene with nebula',
      style: 'space',
      owner_pubkey: 'demo-wallet-8',
      wallet_address: 'demo-wallet-8',
      source: 'demo'
    },
    {
      id: 'demo-9',
      image_url: 'https://picsum.photos/400/400?random=9',
      thumbnail_url: 'https://picsum.photos/400/400?random=9',
      optimized_url: 'https://picsum.photos/400/400?random=9',
      aspect_ratio: 1.0,
      created_at: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
      prompt: 'Minimalist geometric patterns',
      style: 'minimalist',
      owner_pubkey: 'demo-wallet-9',
      wallet_address: 'demo-wallet-9',
      source: 'demo'
    },
    {
      id: 'demo-10',
      image_url: 'https://picsum.photos/400/580?random=10',
      thumbnail_url: 'https://picsum.photos/400/580?random=10',
      optimized_url: 'https://picsum.photos/400/580?random=10',
      aspect_ratio: 0.69,
      created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      prompt: 'Ancient temple ruins at dawn',
      style: 'historical',
      owner_pubkey: 'demo-wallet-10',
      wallet_address: 'demo-wallet-10',
      source: 'demo'
    },
    {
      id: 'demo-11',
      image_url: 'https://picsum.photos/400/460?random=11',
      thumbnail_url: 'https://picsum.photos/400/460?random=11',
      optimized_url: 'https://picsum.photos/400/460?random=11',
      aspect_ratio: 0.87,
      created_at: new Date(Date.now() - 1000 * 60 * 660).toISOString(),
      prompt: 'Cyberpunk street scene with neon lights',
      style: 'cyberpunk',
      owner_pubkey: 'demo-wallet-11',
      wallet_address: 'demo-wallet-11',
      source: 'demo'
    },
    {
      id: 'demo-12',
      image_url: 'https://picsum.photos/400/520?random=12',
      thumbnail_url: 'https://picsum.photos/400/520?random=12',
      optimized_url: 'https://picsum.photos/400/520?random=12',
      aspect_ratio: 0.77,
      created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      prompt: 'Underwater coral reef ecosystem',
      style: 'underwater',
      owner_pubkey: 'demo-wallet-12',
      wallet_address: 'demo-wallet-12',
      source: 'demo'
    }
  ];

  return demoImages.slice(0, limit);
};

// Get all user-generated images for VWall with pagination
router.get('/images', async (req: Request, res: Response) => {
  try {
    console.log('🖼️  VWall API: Fetching images...');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Removed forced demo mode - now fetching real user images from database

    // If Supabase is not configured, return demo images
    if (!supabase) {
      console.log('⚠️  VWall API: Supabase not configured, returning demo images');
      const demoImages = getDemoImages(limit);
      
      return res.json({
        success: true,
        data: demoImages,
        pagination: {
          page,
          limit,
          hasMore: page * limit < 12 // We have 12 demo images
        },
        mode: 'demo'
      });
    }

    let allImages: any[] = [];

    try {
      // Fetch from generated_images table
      const { data: generations, error: generationsError } = await supabase
        .from('generated_images')
        .select(`
          id,
          owner_pubkey,
          image_url,
          thumbnail_url,
          optimized_url,
          style,
          prompt,
          aspect_ratio,
          created_at,
          wallet_address,
          is_public
        `)
        .eq('visible', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (generationsError) {
        console.error('❌ VWall API: Error fetching generations:', generationsError);
      } else {
        console.log(`📊 VWall API: Found ${generations?.length || 0} generations`);
      }

      // Fetch from images table (completed images only)
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select(`
          id,
          original_url,
          processed_url,
          width,
          height,
          created_at,
          metadata
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (imagesError) {
        console.error('❌ VWall API: Error fetching images:', imagesError);
      } else {
        console.log(`📊 VWall API: Found ${images?.length || 0} completed images`);
      }

      // Transform and combine data
      const transformedGenerations = (generations || []).map(gen => {
        // Use the URLs directly from the database
        const imageUrl = gen.image_url || gen.optimized_url || gen.thumbnail_url;
        const thumbnailUrl = gen.thumbnail_url || gen.image_url;
        const optimizedUrl = gen.optimized_url || gen.image_url;
        
        console.log(`🔗 VWall API: Generated image URL for ${gen.id}: ${imageUrl}`);

        return {
          id: gen.id,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          optimized_url: optimizedUrl,
          aspect_ratio: gen.aspect_ratio || 1.0,
          created_at: gen.created_at,
          prompt: gen.prompt || 'AI-generated image',
          style: gen.style || 'ai-enhanced',
          owner_pubkey: gen.owner_pubkey || gen.wallet_address,
          wallet_address: gen.wallet_address || gen.owner_pubkey,
          source: 'generated_images'
        };
      });

      const transformedImages = (images || []).map(img => {
        // Calculate aspect ratio from width and height if available
        const aspectRatio = (img.width && img.height) ? img.width / img.height : 1.0;
        
        // Use processed_url if available, otherwise original_url, otherwise fallback
        let imageUrl = img.processed_url || img.original_url;
        if (!imageUrl) {
          imageUrl = `https://picsum.photos/400/400?random=${img.id}`;
          console.log(`⚠️  VWall API: No URL found for image ${img.id}, using fallback`);
        } else {
          console.log(`🔗 VWall API: Image URL for ${img.id}: ${imageUrl}`);
        }
        
        return {
          id: img.id,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          optimized_url: imageUrl,
          aspect_ratio: aspectRatio,
          created_at: img.created_at,
          prompt: img.metadata?.prompt || 'User uploaded image',
          style: img.metadata?.style || 'original',
          owner_pubkey: img.metadata?.wallet_address || 'anonymous',
          wallet_address: img.metadata?.wallet_address || null,
          source: 'images'
        };
      });

      // Combine and sort by creation date
      allImages = [...transformedGenerations, ...transformedImages]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

    } catch (dbError) {
      console.error('❌ VWall API: Database error:', dbError);
      // If database queries fail, fall back to demo images
      allImages = getDemoImages(limit);
      console.log('🔄 VWall API: Falling back to demo images due to database error');
    }

    // If no images found in database, return demo images
    if (allImages.length === 0) {
      console.log('📭 VWall API: No images found in database, returning demo images');
      allImages = getDemoImages(limit);
    }

    console.log(`✅ VWall API: Returning ${allImages.length} images`);

    res.json({
      success: true,
      data: allImages,
      pagination: {
        page,
        limit,
        hasMore: allImages.length === limit
      },
      mode: allImages[0]?.source === 'demo' ? 'demo' : 'database'
    });

  } catch (error) {
    console.error('❌ VWall API error:', error);
    
    // Even if there's an error, try to return demo images
    try {
      const demoImages = getDemoImages(parseInt(req.query.limit as string) || 20);
      console.log('🔄 VWall API: Returning demo images due to error');
      
      res.json({
        success: true,
        data: demoImages,
        pagination: {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
          hasMore: false
        },
        mode: 'demo',
        error: 'Database error, showing demo content'
      });
    } catch (fallbackError) {
      console.error('❌ VWall API: Even demo images failed:', fallbackError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch images'
      });
    }
  }
});

export default router;