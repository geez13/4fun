import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Sparkles, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface GenerationState {
  isGenerating: boolean;
  generatedImageUrl?: string;
  generationId?: string;
  error?: string;
}

interface GenerationInterfaceProps {
  uploadedFile?: File;
  className?: string;
}

export const GenerationInterface: React.FC<GenerationInterfaceProps> = ({ 
  uploadedFile,
  className = ''
}) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [state, setState] = useState<GenerationState>({
    isGenerating: false
  });

  const generateSignature = async (): Promise<{ signature: string; message: string }> => {
    if (!address || !signMessageAsync) {
      throw new Error('Wallet not connected or does not support message signing');
    }

    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substr(2, 9);
    const message = `AI Generation Request\nWallet: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    const signature = await signMessageAsync({ account: address, message });
    
    return { signature, message };
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `uploads/${timestamp}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('generated_photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return fileName;
  };

  const callGenerationAPI = async (storagePath: string, signature: string, message: string) => {
    const response = await fetch('/api/images/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: address!,
        signature,
        message,
        storage_path: storagePath
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    return response.json();
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setState({ isGenerating: true, error: undefined });

    try {
      // Step 1: Generate signature
      toast.info('Generating wallet signature...');
      const { signature, message } = await generateSignature();

      // Step 2: Upload file to Supabase
      toast.info('Uploading image...');
      const storagePath = await uploadToSupabase(uploadedFile);

      // Step 3: Call generation API
      toast.info('Processing with AI...');
      const result = await callGenerationAPI(storagePath, signature, message);

      if (result.success) {
        setState({
          isGenerating: false,
          generatedImageUrl: result.generated_image_url,
          generationId: result.generation_id
        });
        toast.success('Image generated successfully!');
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        isGenerating: false,
        error: errorMessage
      });
      toast.error(`Generation failed: ${errorMessage}`);
    }
  };

  const handleDownload = async () => {
    if (!state.generatedImageUrl) return;

    try {
      const response = await fetch(state.generatedImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${state.generationId || Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleViewInGallery = () => {
    if (state.generationId) {
      window.open(`/vwall?highlight=${state.generationId}`, '_blank');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Generation Button */}
      <button
        onClick={handleGenerate}
        disabled={!uploadedFile || state.isGenerating || !address || !isConnected}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3
          ${!uploadedFile || state.isGenerating || !address || !isConnected
            ? 'bg-gray-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-purple-500/25'
          }
        `}
      >
        {state.isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate AI Image
          </>
        )}
      </button>

      {/* Status Messages */}
      {!uploadedFile && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">
            Please upload an image to start the AI generation process.
          </p>
        </div>
      )}

      {(!address || !isConnected) && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            Please connect your BNB Chain wallet to proceed.
          </p>
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            Error: {state.error}
          </p>
        </div>
      )}

      {/* Generated Image Result */}
      {state.generatedImageUrl && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Generated Result</h4>
          
          <div className="relative group">
            <img
              src={state.generatedImageUrl}
              alt="AI Generated"
              className="w-full rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                title="Download Image"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handleViewInGallery}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                title="View in Gallery"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleViewInGallery}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View in Gallery
            </button>
          </div>
        </div>
      )}

      {/* Generation Process Info */}
      <div className="p-4 bg-black border border-gray-700/50 rounded-lg">
        <h5 className="text-sm font-medium text-white mb-2">How it works:</h5>
        <ol className="text-xs text-gray-400 space-y-1">
          <li>1. Upload your image to secure storage</li>
          <li>2. Sign message with your wallet for verification</li>
          <li>3. Verify BEP-20 token balance on BNB Chain</li>
          <li>4. Process image with AI enhancement algorithms</li>
          <li>5. Download your enhanced image</li>
        </ol>
      </div>
    </div>
  );
};