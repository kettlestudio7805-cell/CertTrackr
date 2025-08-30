import { useRef, useState } from "react";
import SearchBar from "@/components/search/search-bar";
import CertificateCard from "@/components/certificate/certificate-card";
import DateVerificationModal from "@/components/modals/date-verification-modal";
import CertificateEditModal from "@/components/modals/certificate-edit-modal";
import CertificateViewModal from "@/components/modals/certificate-view-modal";
import { useCertificates } from "@/hooks/use-certificates";
import { useSearch } from "@/hooks/use-search";
import { Certificate } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

type StatusFilter = "all" | "valid" | "expiring" | "expired";

export default function AllCertificates() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showDateVerification, setShowDateVerification] = useState(false);
  const [verificationMode, setVerificationMode] = useState<"create" | "update">("create");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [uploadData, setUploadData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const renewFileInputRef = useRef<HTMLInputElement | null>(null);

  const { certificates, isLoading } = useCertificates({ status: statusFilter, limit: 100 });
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();

  const displayCertificates = searchQuery ? searchResults : certificates;

  const handleEditCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowEditModal(true);
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowViewModal(true);
  };

  const handleRenewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setVerificationMode("update");
    renewFileInputRef.current?.click();
  };

  const handleRenewFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiRequest('POST', '/api/certificates/upload', formData);
    const data = await response.json();
    setUploadData(data);
    setShowDateVerification(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <input ref={renewFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleRenewFileSelected} />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">All Certificates</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
              placeholder="Search certificates by name or content..."
              data-testid="search-all-certificates"
            />
          </div>
          
          <div className="sm:w-48">
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificates</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {displayCertificates && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {searchQuery ? (
            <>Found {displayCertificates.length} certificate{displayCertificates.length !== 1 ? 's' : ''} matching "{searchQuery}"</>
          ) : (
            <>Showing {displayCertificates.length} certificate{displayCertificates.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}

      {/* Certificates Grid */}
      {isLoading || isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : displayCertificates && displayCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onEdit={() => handleEditCertificate(certificate)}
              onRenew={() => handleRenewCertificate(certificate)}
              onViewDetails={() => handleViewCertificate(certificate)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="fas fa-certificate text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No certificates found' : 'No certificates yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? 'Try adjusting your search terms or filters' 
              : 'Upload your first certificate to get started'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showDateVerification && uploadData && (
        <DateVerificationModal
          uploadData={uploadData}
          mode={verificationMode}
          certificateId={verificationMode === 'update' ? selectedCertificate?.id : undefined}
          onClose={() => {
            setShowDateVerification(false);
            setUploadData(null);
            setVerificationMode('create');
          }}
          onConfirm={() => {
            setShowDateVerification(false);
            setUploadData(null);
            setVerificationMode('create');
            setSelectedCertificate(null);
          }}
        />
      )}

      {showViewModal && selectedCertificate && (
        <CertificateViewModal
          certificate={selectedCertificate}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCertificate(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showEditModal && selectedCertificate && (
        <CertificateEditModal
          certificate={selectedCertificate}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCertificate(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setSelectedCertificate(null);
          }}
        />
      )}
    </div>
  );
}
