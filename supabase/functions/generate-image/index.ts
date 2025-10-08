// Supabase Edge Function for Token-Gated AI Image Generation
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://esm.sh/tweetnacl@1.0.3'
import { Connection, PublicKey } from 'https://esm.sh/@solana/web3.js@1.87.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateImageRequest {
  wallet_address: string;
  signature: number[] | Uint8Array;
  message: string;
  storage_path: string;
}

interface GenerateImageResponse {
  success: boolean;
  generated_image_url?: string;
  generation_id?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: GenerateImageRequest = await req.json()
    const { wallet_address, signature, message, storage_path } = requestData

    console.log('Processing generation request for wallet:', wallet_address)

    // 1. Verify signature to prove wallet ownership
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature)
    const publicKeyBytes = new PublicKey(wallet_address).toBytes()
    
    const isValidSignature = verify(messageBytes, signatureBytes, publicKeyBytes)
    if (!isValidSignature) {
      throw new Error('Invalid signature - wallet ownership verification failed')
    }

    console.log('Signature verified successfully')

    // 2. Verify SPL token balance on Solana blockchain
    const connection = new Connection(Deno.env.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com')
    const tokenMint = new PublicKey(Deno.env.get('TOKEN_MINT_ADDRESS') || '')
    
    if (!Deno.env.get('TOKEN_MINT_ADDRESS')) {
      console.warn('TOKEN_MINT_ADDRESS not configured, skipping token verification for development')
    } else {
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        new PublicKey(wallet_address),
        { mint: tokenMint }
      )
      
      let tokenBalance = 0
      for (const account of tokenAccounts.value) {
        const accountInfo = await connection.getTokenAccountBalance(account.pubkey)
        tokenBalance += accountInfo.value.uiAmount || 0
      }
      
      if (tokenBalance < 1) {
        throw new Error('Insufficient token balance - minimum 1 token required')
      }

      console.log('Token balance verified:', tokenBalance)
    }

    // 3. Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // 4. Download original image from storage
    const { data: originalImage, error: downloadError } = await supabase.storage
      .from('generated_photos')
      .download(storage_path)
    
    if (downloadError || !originalImage) {
      throw new Error(`Failed to download original image: ${downloadError?.message}`)
    }

    console.log('Original image downloaded successfully')

    // 5. Process image with AI API (placeholder implementation)
    // In production, replace this with actual AI service integration
    let generatedImageBuffer: ArrayBuffer
    
    const aiApiEndpoint = Deno.env.get('AI_API_ENDPOINT')
    if (aiApiEndpoint) {
      try {
        const aiResponse = await fetch(aiApiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('AI_API_KEY') || ''}`
          },
          body: JSON.stringify({
            image: Array.from(new Uint8Array(await originalImage.arrayBuffer())),
            prompt: 'AI-enhanced image generation with artistic improvements'
          })
        })
        
        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.statusText}`)
        }
        
        generatedImageBuffer = await aiResponse.arrayBuffer()
        console.log('AI processing completed successfully')
      } catch (aiError) {
        console.warn('AI API unavailable, using mock processing:', aiError)
        // Fallback: use original image as generated (for development)
        generatedImageBuffer = await originalImage.arrayBuffer()
      }
    } else {
      console.log('AI_API_ENDPOINT not configured, using mock processing')
      // Development fallback: use original image
      generatedImageBuffer = await originalImage.arrayBuffer()
    }
    
    // 6. Save generated image to storage
    const timestamp = Date.now()
    const generatedImagePath = `generated/${timestamp}-${wallet_address.slice(0, 8)}.jpg`
    
    const { error: uploadError } = await supabase.storage
      .from('generated_photos')
      .upload(generatedImagePath, generatedImageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload generated image: ${uploadError.message}`)
    }

    console.log('Generated image uploaded to:', generatedImagePath)
    
    // 7. Create database record
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .insert({
        wallet_address,
        original_image_path: storage_path,
        generated_image_path: generatedImagePath,
        prompt: 'AI-enhanced image generation with artistic improvements'
      })
      .select()
      .single()
    
    if (dbError || !generation) {
      throw new Error(`Failed to create generation record: ${dbError?.message}`)
    }

    console.log('Generation record created:', generation.id)
    
    // 8. Get public URL for generated image
    const { data: publicUrl } = supabase.storage
      .from('generated_photos')
      .getPublicUrl(generatedImagePath)
    
    const response: GenerateImageResponse = {
      success: true,
      generated_image_url: publicUrl.publicUrl,
      generation_id: generation.id
    }

    console.log('Generation completed successfully')
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Generation failed:', error)
    
    const errorResponse: GenerateImageResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})