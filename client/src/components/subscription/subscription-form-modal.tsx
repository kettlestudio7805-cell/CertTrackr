import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subscription, InsertSubscription, UpdateSubscription } from "@shared/schema";

interface SubscriptionFormModalProps {
  subscription?: Subscription;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit" | "renew";
}

export default function SubscriptionFormModal({ 
  subscription, 
  onClose, 
  onSuccess, 
  mode 
}: SubscriptionFormModalProps) {
  const [title, setTitle] = useState(subscription?.title || "");
  const [email, setEmail] = useState(subscription?.email || "");
  const [cardTitle, setCardTitle] = useState(subscription?.cardTitle || "");
  const [endDate, setEndDate] = useState(subscription?.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : "");
  const [amount, setAmount] = useState(subscription?.amount?.toString() || "");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with subscription data if editing
  useEffect(() => {
    if (subscription) {
      setTitle(subscription.title);
      setEmail(subscription.email);
      setCardTitle(subscription.cardTitle);
      setAmount(subscription.amount?.toString() || "");
    }
  }, [subscription]);

  const mutation = useMutation({
    mutationFn: async (data: InsertSubscription | UpdateSubscription) => {
      if ((mode === "edit" || mode === "renew") && subscription) {
        const response = await apiRequest('PATCH', `/api/subscriptions/${subscription.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/subscriptions', data);
        return response.json();
      }
    },
    onSuccess: () => {
      const action = mode === "create" ? "created" : mode === "edit" ? "updated" : "renewed";
      toast({
        title: `Subscription ${action} successfully`,
        description: `Your subscription has been ${action}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/stats"] });
      onSuccess();
    },
    onError: (error: any) => {
      const action = mode === "create" ? "create" : mode === "edit" ? "update" : "renew";
      toast({
        title: `Failed to ${action} subscription`,
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !email || !cardTitle || !endDate || !amount) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    const subscriptionData = {
      title,
      email,
      cardTitle,
      endDate,
      amount: parseFloat(amount),
    };

    if (subscription && mode === "edit") {
      mutation.mutate(subscriptionData);
    } else {
      mutation.mutate(subscriptionData);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "create": return "Add New Subscription";
      case "edit": return "Edit Subscription";
      case "renew": return "Renew Subscription";
      default: return "Subscription";
    }
  };

  const getSubmitButtonText = () => {
    if (mutation.isPending) {
      switch (mode) {
        case "create": return "Creating...";
        case "edit": return "Updating...";
        case "renew": return "Renewing...";
        default: return "Processing...";
      }
    }
    
    switch (mode) {
      case "create": return "Create Subscription";
      case "edit": return "Update Subscription";
      case "renew": return "Renew Subscription";
      default: return "Submit";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-credit-card text-blue-600 mr-2"></i>
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Subscription Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Netflix Premium, Spotify Family"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="cardTitle">Payment Card Title *</Label>
            <Input
              id="cardTitle"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="e.g., Visa ending in 1234"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You can select any date, including past dates for expired subscriptions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Subscription amount in Indian Rupees (₹)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={mutation.isPending}
              className={
                mode === "renew" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {mutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {getSubmitButtonText()}
                </>
              ) : (
                <>
                  <i className={`fas ${
                    mode === "create" ? "fa-plus" : 
                    mode === "edit" ? "fa-save" : "fa-sync-alt"
                  } mr-2`}></i>
                  {getSubmitButtonText()}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
