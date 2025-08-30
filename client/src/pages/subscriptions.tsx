import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SubscriptionCard from "@/components/subscription/subscription-card";
import SubscriptionFormModal from "@/components/subscription/subscription-form-modal";
import { Subscription } from "@shared/schema";

export default function SubscriptionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [renewingSubscription, setRenewingSubscription] = useState<Subscription | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscriptions');
      return response.json();
    },
  });

  // Sort: expired first, then soonest upcoming, then later ones
  const sortedSubscriptions = [...subscriptions].sort((a: Subscription, b: Subscription) => {
    const now = Date.now();
    const aDays = Math.floor((new Date(a.endDate).getTime() - now) / (1000 * 60 * 60 * 24));
    const bDays = Math.floor((new Date(b.endDate).getTime() - now) / (1000 * 60 * 60 * 24));
    return aDays - bDays; // negatives (expired) first, then 0/positives ascending
  });

  // Fetch subscription stats
  const { data: stats } = useQuery({
    queryKey: ["/api/subscriptions/stats"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscriptions/stats');
      return response.json();
    },
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // DELETE returns 204 (No Content); do not call res.json()
      await apiRequest('DELETE', `/api/subscriptions/${id}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Subscription deleted",
        description: "The subscription has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/stats"] });
    },
    onError: () => {
      toast({
        title: "Failed to delete subscription",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleRenew = (subscription: Subscription) => {
    setRenewingSubscription(subscription);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingSubscription(null);
    setRenewingSubscription(null);
  };

  const handleSuccess = () => {
    handleModalClose();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load subscriptions. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your paid subscriptions and track their expiry dates
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Subscription
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.valid}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.expiring}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.expired}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-credit-card text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No subscriptions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start tracking your subscriptions by adding your first one.
          </p>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Add First Subscription
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSubscriptions.map((subscription: Subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRenew={handleRenew}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <SubscriptionFormModal
          mode="create"
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {editingSubscription && (
        <SubscriptionFormModal
          subscription={editingSubscription}
          mode="edit"
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {renewingSubscription && (
        <SubscriptionFormModal
          subscription={renewingSubscription}
          mode="renew"
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
