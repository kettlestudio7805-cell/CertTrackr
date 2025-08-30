import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Certificate } from "@shared/schema";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";

interface CertificateViewModalProps {
  certificate: Certificate;
  onClose: () => void;
  onEdit: () => void;
}

export default function CertificateViewModal({ certificate, onClose, onEdit }: CertificateViewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const expiryDate = new Date(certificate.expiryDate);
  const isExpired = isPast(expiryDate);
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

  const getStatusInfo = () => {
    if (isExpired) {
      return {
        status: "Expired",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: "fa-exclamation-circle",
      };
    } else if (isExpiringSoon) {
      return {
        status: `${daysUntilExpiry} days`,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: "fa-clock",
      };
    } else {
      return {
        status: "Valid",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "fa-check-circle",
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="certificate-view-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-certificate text-blue-600"></i>
            Certificate Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Header */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {certificate.name}
                </h3>
                {certificate.issuer && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <i className="fas fa-building mr-2"></i>
                    {certificate.issuer}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
                <i className={`fas ${statusInfo.icon} mr-2`}></i>
                {statusInfo.status}
              </span>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                Expiry Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Expiry Date:</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    {expiryDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    {isExpired ? `${Math.abs(daysUntilExpiry)} days overdue` : isExpiringSoon ? `${daysUntilExpiry} days remaining` : `${daysUntilExpiry} days remaining`}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <i className="fas fa-file-upload mr-2 text-blue-600"></i>
                File Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">File Name:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{certificate.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(certificate.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uploaded:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDistanceToNow(new Date(certificate.uploadedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* OCR Text */}
          {certificate.ocrText && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <i className="fas fa-file-text mr-2 text-blue-600"></i>
                Extracted Text
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                {certificate.ocrText}
              </div>
            </div>
          )}

          {/* File Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <i className="fas fa-eye mr-2 text-blue-600"></i>
              File Preview
            </h4>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
              <i className="fas fa-file-pdf text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {certificate.fileName}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Click below to download and view your certificate
                </p>
                <a 
                  href={certificate.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  data-testid="button-download-file"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download Certificate
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-close-view">
            Close
          </Button>
          <Button onClick={onEdit} data-testid="button-edit-from-view">
            <i className="fas fa-edit mr-2"></i>
            Edit Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
