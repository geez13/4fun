import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  Download, 
  ImageIcon, 
  Loader2, 
  X, 
  Share2, 
  Twitter
} from 'lucide-react'
import Layout from '../components/Layout'
import { TokenGateChecker } from '../components/TokenGateChecker'
import ConditionalUploadZone from '../components/ConditionalUploadZone'
import ErrorBoundary from '../components/ErrorBoundary'
import RetryButton from '../components/RetryButton'
import { apiService, ImageResponse } from '../services/api'

interface ImageData {
  file: File
  url: string
  processedUrl?: string
  imageId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export default function Editor() {
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isSharing, setIsSharing] = useState(false)
  const [hasTokenAccess, setHasTokenAccess] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleTokenAccessGranted = (token: string) => {
    setHasTokenAccess(true)
    setSessionToken(token)
  }

  const handleTokenAccessDenied = () => {
    setHasTokenAccess(false)
    setSessionToken(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setCurrentImage({
      file,
      url,
      status: 'pending'
    })
  }

  const handleProcessImage = async () => {
    if (!currentImage) return

    setCurrentImage(prev => prev ? { ...prev, status: 'processing', error: undefined } : null)
    setProcessingProgress(0)

    try {
      // Step 1: Upload the image to get an imageId
      setProcessingProgress(10)
      console.log('🔄 Uploading image to server...')
      
      const uploadResponse = await apiService.uploadImage(currentImage.file)
      
      if (!uploadResponse.success || !uploadResponse.data?.imageId) {
        throw new Error(uploadResponse.error || 'Failed to upload image')
      }

      const imageId = uploadResponse.data.imageId
      console.log('✅ Image uploaded successfully, ID:', imageId)
      
      // Update state with imageId
      setCurrentImage(prev => prev ? { ...prev, imageId } : null)
      setProcessingProgress(30)

      // Step 2: Process the uploaded image with four-finger magic
      console.log('🎨 Processing image with four-finger magic...')
      
      const processResponse = await apiService.processFourFinger(imageId)
      
      if (!processResponse.success) {
        throw new Error(processResponse.error || 'Failed to process image')
      }

      setProcessingProgress(60)
      console.log('✅ Four-finger processing initiated successfully')

      // Step 3: Use the processed image URL directly from the response
      if (processResponse.data?.processedImageUrl) {
        console.log('✅ Processed image received:', processResponse.data.processedImageUrl)
        setCurrentImage(prev => prev ? {
          ...prev,
          processedUrl: processResponse.data.processedImageUrl,
          status: 'completed'
        } : null)
        setProcessingProgress(100)
      } else {
        throw new Error('No processed image URL received from processing')
      }

    } catch (error) {
      console.error('❌ Error processing image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setCurrentImage(prev => prev ? { 
        ...prev, 
        status: 'failed',
        error: errorMessage
      } : null)
    }
  }

  const handleDownload = () => {
    if (currentImage?.processedUrl) {
      const link = document.createElement('a')
      link.href = currentImage.processedUrl
      link.download = `4finger-enhanced-${currentImage.file.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleReset = () => {
    if (currentImage?.url) {
      URL.revokeObjectURL(currentImage.url)
    }
    if (currentImage?.processedUrl && currentImage.processedUrl !== currentImage.url) {
      URL.revokeObjectURL(currentImage.processedUrl)
    }
    setCurrentImage(null)
    setProcessingProgress(0)
  }

  const handleShareOnX = async () => {
    if (!currentImage?.processedUrl) return

    setIsSharing(true)
    try {
      const tweetText = encodeURIComponent(
        "Just enhanced my photo with 4-Finger Magic! 🚀✨ Check out this amazing AI-powered transformation. #4FingerMagic #AI #PhotoEnhancement #BNBChain"
      )
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`
      window.open(tweetUrl, '_blank', 'width=550,height=420')
    } catch (error) {
      console.error('Error sharing on X:', error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="min-h-screen bg-black py-12">
          {/* Header with Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center mb-8">
            <div className="flex space-x-8">
              <button
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-solana-gradient text-white"
              >
                4-Finger Magic
              </button>
            </div>
          </div>

          {/* Token Gate Section */}
          <div className="mb-8">
            <TokenGateChecker
              requiredTokens={1}
              onAccessGranted={handleTokenAccessGranted}
              onAccessDenied={handleTokenAccessDenied}
            >
              <div className="text-center text-gray-400">
                Connect your wallet and verify token ownership to access 4-Finger Magic features.
              </div>
            </TokenGateChecker>
          </div>

          {/* Tab Content */}
          <div>
              {/* V-Sign Magic Tab */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Original Image Panel */}
                <div className="space-y-6">
                  <div className="bg-black border border-dark-600 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Original Image</h3>
                    
                    {!currentImage ? (
                      <ConditionalUploadZone
                        hasTokenAccess={hasTokenAccess}
                        sessionToken={sessionToken}
                        onImageUploaded={(imageData) => {
                          setCurrentImage({
                            file: imageData.file,
                            url: imageData.url,
                            imageId: imageData.imageId,
                            status: 'pending'
                          })
                        }}
                        isDragOver={isDragOver}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onFileSelect={handleFileSelect}
                        fileInputRef={fileInputRef}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={currentImage.url}
                            alt="Original"
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            <p>{currentImage.file.name}</p>
                            <p>{formatFileSize(currentImage.file.size)}</p>
                          </div>
                          <button
                            onClick={handleReset}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                          onClick={handleProcessImage}
                          disabled={currentImage.status === 'processing'}
                          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                            currentImage.status === 'processing'
                              ? 'bg-black cursor-not-allowed'
              : 'bg-binance-gradient hover:opacity-90 text-white'
                          }`}
                        >
                          {currentImage.status === 'processing' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </div>
                          ) : (
                            'Add 4-Finger Magic'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processed Image Panel */}
                <div className="space-y-6">
                  <div className="bg-black border border-dark-600 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Enhanced Image</h3>
                    
                    {currentImage?.status === 'processing' ? (
                      <div className="text-center py-12">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                          <div className="absolute inset-0 border-4 border-binance-primary/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-transparent border-t-binance-primary rounded-full animate-spin"></div>
                          <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 bg-binance-gradient rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <p className="text-lg font-medium text-gray-300 mb-2">
                          Adding 4-Finger Magic...
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.round(processingProgress)}% complete
                        </p>
                      </div>
                    ) : currentImage?.status === 'completed' && currentImage.processedUrl ? (
                      <div className="w-full space-y-4">
                        <div className="relative">
                          <img
                            src={currentImage.processedUrl}
                            alt="4-Finger Enhanced"
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                        <button
                          onClick={handleDownload}
                          className="bg-binance-gradient text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 inline-flex items-center space-x-2"
                        >
                          <Download className="w-5 h-5" />
                          <span>Download Enhanced Image</span>
                        </button>
                      </div>
                    ) : currentImage?.status === 'failed' ? (
                      <div className="text-center text-red-500">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <p className="font-medium">Processing Failed</p>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                          {currentImage.error || 'Please try uploading a different image'}
                        </p>
                        <div className="flex justify-center space-x-3">
                          <RetryButton
                            onRetry={handleProcessImage}
                            isLoading={false}
                            text="Retry Processing"
                          />
                          <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-binance-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Upload New Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Click "Add 4-Finger Magic" to process your image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-12 bg-black border border-dark-600 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4">How it works</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-binance-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Connect Wallet</h4>
                      <p className="text-sm text-gray-300">
                        Connect your BNB Chain wallet and verify you have ≥1 "4" token
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-binance-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Upload Image</h4>
                      <p className="text-sm text-gray-300">
                        Drag and drop or click to upload your photo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-binance-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-white">AI Processing</h4>
                      <p className="text-sm text-gray-300">
                        Our AI analyzes and adds the perfect 4-finger gesture
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-binance-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Download</h4>
                      <p className="text-sm text-gray-300">
                        Download your enhanced image with 4-finger magic
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* X (Twitter) Sharing Section */}
              {currentImage?.status === 'completed' && currentImage?.processedUrl && (
                <div className="mt-12 bg-black border border-dark-600 rounded-2xl p-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Share Your Creation
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Show off your enhanced 4-finger PFP to the world!
                    </p>
                    <button
                      onClick={handleShareOnX}
                      disabled={isSharing}
                      className="inline-flex items-center px-6 py-3 bg-black hover:bg-gray-900 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-900"
                      aria-label="Share on X (formerly Twitter)"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Twitter className="w-5 h-5 mr-2" />
                          Share on X
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      Pre-filled with engaging text and hashtags
                    </p>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </Layout>
    </ErrorBoundary>
  )
}