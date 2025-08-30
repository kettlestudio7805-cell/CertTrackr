import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Certificate } from "@shared/schema";

interface CertificateEditModalProps {
  certificate: Certificate;
  onClose: () => void;
  onSave: () => void;
}

export default function CertificateEditModal({ certificate, onClose, onSave }: CertificateEditModalProps) {
  const [name, setName] = useState(certificate.name);
  const [issuer, setIssuer] = useState(certificate.issuer || '');
  const [expiryDate, setExpiryDate] = useState(() => {
    return new Date(certificate.expiryDate).toISOString().split('T')[0];
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/certificates/${certificate.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate updated",
        description: "Your changes have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/stats"] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update certificate",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/certificates/${certificate.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Certificate deleted",
        description: "The certificate has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/stats"] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete certificate",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim() || !expiryDate) {
      toast({
        title: "Missing information",
        description: "Please provide both certificate name and expiry date",
        variant: "destructive",
      });
      return;
    }

    updateCertificateMutation.mutate({
      name: name.trim(),
      issuer: issuer.trim() || null,
      expiryDate: new Date(expiryDate).toISOString(),
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this certificate? This action cannot be undone.")) {
      deleteCertificateMutation.mutate();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="certificate-edit-modal">
        <DialogHeader>
          <DialogTitle>Edit Certificate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="certificateName">Certificate Name *</Label>
            <Input
              id="certificateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter certificate name"
              data-testid="input-edit-name"
            />
          </div>

          <div>
            <Label htmlFor="issuer">Issuing Organization</Label>
            <Input
              id="issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g., Amazon Web Services"
              data-testid="input-edit-issuer"
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              data-testid="input-edit-expiry-date"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>File:</strong> {certificate.fileName}</p>
            <p><strong>Uploaded:</strong> {new Date(certificate.uploadedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteCertificateMutation.isPending}
            data-testid="button-delete"
          >
            {deleteCertificateMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash mr-1"></i>
                Delete
              </>
            )}
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateCertificateMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateCertificateMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
