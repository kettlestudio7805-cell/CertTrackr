import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete: (data: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/certificates/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      onUploadComplete(data);
      toast({
        title: "File uploaded successfully",
        description: "Please verify the detected expiry date",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process the file",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploading(true);
      uploadMutation.mutate(acceptedFiles[0]);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload New Certificate</h2>
      
      <div 
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        data-testid="file-upload-area"
      >
        <input {...getInputProps()} data-testid="file-upload-input" />
        
        <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
          <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 dark:text-gray-500"></i>
        </div>
        
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {uploading ? 'Processing...' : isDragActive ? 'Drop your certificate here' : 'Drop your certificate here'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Supports PDF, JPG, PNG up to 10MB
        </p>
        
        <button 
          type="button"
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          data-testid="browse-files-button"
        >
          {uploading ? 'Processing...' : 'Browse Files'}
        </button>
      </div>

      {uploading && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Processing file...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Extracting text and detecting expiry date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
