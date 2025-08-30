import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateVerificationModalProps {
  uploadData: {
    ocrText: string;
    extractedDate: string | null;
    confidence: number;
    fileName: string;
    fileSize: number;
    filePath: string; // Add filePath to the interface
  };
  onClose: () => void;
  onConfirm: () => void;
  mode?: "create" | "update";
  certificateId?: string;
}

export default function DateVerificationModal({ uploadData, onClose, onConfirm, mode = "create", certificateId }: DateVerificationModalProps) {
  const [manualDate, setManualDate] = useState(() => {
    if (uploadData.extractedDate) {
      return new Date(uploadData.extractedDate).toISOString().split('T')[0];
    }
    return '';
  });
  const [certificateName, setCertificateName] = useState(() => {
    // Extract potential certificate name from filename
    const nameFromFile = uploadData.fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
    return nameFromFile;
  });
  const [issuer, setIssuer] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === "update" && certificateId) {
        const response = await apiRequest('PATCH', `/api/certificates/${certificateId}`, data);
        return response.json();
      }
      const response = await apiRequest('POST', '/api/certificates', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: mode === "update" ? "Certificate renewed" : "Certificate saved",
        description: mode === "update" ? "The certificate has been replaced with the new one" : "Your certificate has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/stats"] });
      onConfirm();
    },
    onError: (error: any) => {
      toast({
        title: mode === "update" ? "Failed to renew certificate" : "Failed to save certificate",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!manualDate || !certificateName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both certificate name and expiry date",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: certificateName.trim(),
      issuer: issuer.trim() || null,
      expiryDate: new Date(manualDate).toISOString(),
      fileName: uploadData.fileName,
      fileSize: uploadData.fileSize,
      ocrText: uploadData.ocrText,
      filePath: uploadData.filePath, // Add filePath to the payload
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="date-verification-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-robot text-blue-600 mr-2"></i>
            {mode === "update" ? "Renew Certificate" : "Verify Certificate Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Preview */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Document processed:</p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
              <i className="fas fa-file-pdf text-red-500 text-xl mr-3"></i>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{uploadData.fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(uploadData.fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          </div>

          {/* AI Detection Results */}
          {uploadData.extractedDate && (
            <div>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-brain text-blue-600 dark:text-blue-400 text-sm"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">AI Detection Complete</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(uploadData.confidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Detected Expiry Date:</strong>
                </p>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="detected-date">
                    {new Date(uploadData.extractedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="certificateName">Certificate Name *</Label>
              <Input
                id="certificateName"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                placeholder="Enter certificate name"
                data-testid="input-certificate-name"
              />
            </div>

            <div>
              <Label htmlFor="issuer">Issuing Organization</Label>
              <Input
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g., Amazon Web Services"
                data-testid="input-issuer"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                data-testid="input-expiry-date"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={mutation.isPending}
            data-testid="button-confirm"
          >
            {mutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                {mode === "update" ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <i className="fas fa-check mr-1"></i>
                {mode === "update" ? 'Confirm & Update' : 'Confirm & Save'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
