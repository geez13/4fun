import { create } from 'zustand'

export interface ImageRecord {
  id: string
  originalUrl: string
  processedUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  userId?: string
}

interface ImageState {
  images: ImageRecord[]
  currentImage: ImageRecord | null
  isProcessing: boolean
  uploadProgress: number
  setImages: (images: ImageRecord[]) => void
  addImage: (image: ImageRecord) => void
  updateImage: (id: string, updates: Partial<ImageRecord>) => void
  setCurrentImage: (image: ImageRecord | null) => void
  setProcessing: (processing: boolean) => void
  setUploadProgress: (progress: number) => void
  clearImages: () => void
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  currentImage: null,
  isProcessing: false,
  uploadProgress: 0,
  setImages: (images) => set({ images }),
  addImage: (image) =>
    set((state) => ({
      images: [image, ...state.images],
    })),
  updateImage: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
      currentImage:
        state.currentImage?.id === id
          ? { ...state.currentImage, ...updates }
          : state.currentImage,
    })),
  setCurrentImage: (image) => set({ currentImage: image }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  clearImages: () => set({ images: [], currentImage: null }),
}))