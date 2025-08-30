import { useState } from "react";
import { Subscription } from "@shared/schema";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onRenew: (subscription: Subscription) => void;
}

export default function SubscriptionCard({ 
  subscription, 
  onEdit, 
  onDelete, 
  onRenew 
}: SubscriptionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  
  const endDate = new Date(subscription.endDate);
  const isExpired = isPast(endDate);
  const daysUntilExpiry = differenceInDays(endDate, new Date());
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
        status: "Active",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "fa-check-circle",
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {subscription.title}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subscription.email}
              </p>
            </div>
            <Badge className={statusInfo.className}>
              <i className={`fas ${statusInfo.icon} mr-2`}></i>
              {statusInfo.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Card Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Card</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {subscription.cardTitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subscription Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(subscription.progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={subscription.progressPercentage} 
              className={`h-2 ${
                isExpired 
                  ? '[&>div]:bg-red-500' 
                  : isExpiringSoon 
                    ? '[&>div]:bg-yellow-500' 
                    : '[&>div]:bg-green-500'
              }`}
            />
          </div>

          {/* Expiry and Amount Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</p>
                <p className={`font-medium ${
                  isExpired 
                    ? 'text-red-600 dark:text-red-400' 
                    : isExpiringSoon 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-green-600 dark:text-green-400'
                }`}>
                  {endDate.toLocaleDateString()} 
                  {!isExpired && ` (${formatDistanceToNow(endDate, { addSuffix: true })})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                <p className="font-medium text-green-600 dark:text-green-400">
                  ₹{(typeof subscription.amount === 'number' ? subscription.amount : parseFloat(subscription.amount || '0')).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isExpired ? (
              // Expired subscription: Renew and Delete buttons (50-50)
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowRenewDialog(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Renew
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </Button>
              </>
            ) : (
              // Active subscription: Edit and Delete buttons (50-50)
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(subscription)}
                  className="flex-1"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the subscription "{subscription.title}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(subscription.id);
                  setShowDeleteDialog(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              The subscription "{subscription.title}" has expired. 
              Click below to renew it with updated details.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRenewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onRenew(subscription);
                  setShowRenewDialog(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Renew Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
