import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, Sparkles, Zap, Shield, ArrowRight, Image as ImageIcon, Wallet, DollarSign, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import Layout from '@/components/Layout'
import SolanaVSign from '@/components/SolanaVSign'
import { useImageStore } from '@/store/imageStore'
import { apiService } from '@/services/api'
import { toast } from 'sonner'
import vsignLogoUrl from '@/assets/vsignlogo.svg'

export default function Home() {
  const navigate = useNavigate()
  const { setCurrentImage } = useImageStore()
  const [processing, setProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Token contract address (placeholder)
  const tokenContractAddress = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Contract address copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setProcessing(true)

    try {
      console.log('Starting upload for file:', file.name, 'Size:', file.size)
      
      const response = await apiService.uploadImage(file)
      
      console.log('Upload response:', response)
      
      if (response.success && response.data) {
        const imageRecord = {
          id: response.data.imageId,
          originalUrl: response.data.originalUrl,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        }
        
        setCurrentImage(imageRecord)
        toast.success('Image uploaded successfully!')
        navigate('/editor')
      } else {
        console.error('Upload failed - response:', response)
        throw new Error(response.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setProcessing(false)
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: isUploading
  })

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated V-Sign Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-48 md:w-40 md:h-60 lg:w-48 lg:h-72">
            <img 
              src={vsignLogoUrl}
              alt="V-Sign Logo"
              className="w-full h-full animate-wave-gentle object-contain"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(153, 69, 255, 0.3))'
              }}
            />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center">
          Add{' '}
          <span className="text-solana-gradient">
            ✌️-Sign Magic
          </span>
          {' '}to Your Photos
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto text-center">
          Yo degens! 🚀 Ready to make your PFP absolutely BASED? Our cutting-edge AI tech 
          will add the most fire ✌️-signs to your pics. Diamond hands guaranteed! 💎🙌 
          WAGMI to the moon with these sick peace signs! 🌙
        </p>
        
        <div className="text-center">
          <button
            onClick={() => navigate('/editor')}
            className="bg-solana-gradient text-white px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-all duration-200 inline-flex items-center space-x-2"
          >
            <span>Change the PFP & Join ✌🏼 Movement</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </Layout>
  )
}