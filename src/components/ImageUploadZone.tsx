import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadZoneProps {
  onFileSelect?: (file: File) => void;
  maxFiles?: number;
  className?: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ 
  onFileSelect,
  maxFiles = 1,
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));

      setUploadedFiles(prev => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, maxFiles);
      });

      // Call the callback with the first file
      if (onFileSelect && acceptedFiles[0]) {
        onFileSelect(acceptedFiles[0]);
      }

      toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setIsUploading(false);
    }
  }, [onFileSelect, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // Revoke object URL to prevent memory leaks
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-gray-600 hover:border-gray-500 bg-black'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-purple-500/20' : 'bg-black'}
          `}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-purple-400' : 'text-gray-400'}`} />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-white">
              {isDragActive ? 'Drop your images here' : 'Upload your images'}
            </p>
            <p className="text-sm text-gray-400">
              Drag & drop or click to select • JPEG, PNG, WebP up to 10MB
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-gray-500">
                Maximum {maxFiles} files
              </p>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl">
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-3 bg-black rounded-lg border border-gray-700/50"
              >
                <div className="flex-shrink-0">
                  <img
                    src={uploadedFile.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};