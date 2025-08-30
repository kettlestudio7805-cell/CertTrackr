import { Certificate } from "@shared/schema";
import { isPast, differenceInDays } from "date-fns";

interface CertificateCardProps {
  certificate: Certificate;
  onEdit: () => void;
  onRenew: () => void;
  onViewDetails: () => void;
}

export default function CertificateCard({ certificate, onEdit, onRenew, onViewDetails }: CertificateCardProps) {
  const expiryDate = new Date(certificate.expiryDate);
  const isExpired = isPast(expiryDate);

  // Countdown window: 15 days → 100% green, approaches 0% as expiry nears
  const COUNTDOWN_WINDOW_DAYS = 15;
  const daysRemaining = Math.max(0, differenceInDays(expiryDate, new Date()));
  const remainingPercent = isExpired
    ? 0
    : Math.min(100, Math.max(0, (daysRemaining / COUNTDOWN_WINDOW_DAYS) * 100));

  const isExpiringSoon = !isExpired && remainingPercent <= 40; // orange at ≤40%

  const getStatusInfo = () => {
    if (isExpired) {
      return {
        status: "Expired",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: "fa-exclamation-circle",
        borderColor: "border-red-200 dark:border-red-800",
      };
    } else if (isExpiringSoon) {
      return {
        status: `${daysRemaining} days`,
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        icon: "fa-clock",
        borderColor: "border-orange-200 dark:border-orange-800",
      };
    } else {
      return {
        status: "Valid",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "fa-check-circle",
        borderColor: "border-gray-200 dark:border-gray-700",
      };
    }
  };

  const getProgressColor = () => {
    if (isExpired) return "bg-red-500";
    if (isExpiringSoon) return "bg-orange-500";
    return "bg-green-500";
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className={`certificate-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${statusInfo.borderColor} p-6 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg`}
      data-testid={`certificate-card-${certificate.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1" data-testid="certificate-name">
            {certificate.name}
          </h3>
          {certificate.issuer && (
            <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="certificate-issuer">
              {certificate.issuer}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`} data-testid="certificate-status">
          <i className={`fas ${statusInfo.icon} mr-1`}></i>
          {statusInfo.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Expiry Date:</span>
          <span className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`} data-testid="certificate-expiry-date">
            {expiryDate.toLocaleDateString()}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor()}`} 
            style={{ width: `${remainingPercent}%` }}
            data-testid="certificate-progress"
          ></div>
        </div>
      </div>

      <div className="flex space-x-2">
        {isExpired ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRenew();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            data-testid="button-renew"
          >
            <i className="fas fa-sync-alt mr-1"></i>
            Renew
          </button>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            data-testid="button-view-details"
          >
            <i className="fas fa-eye mr-1"></i>
            View Details
          </button>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          data-testid="button-edit"
          title="Edit Certificate"
        >
          <i className="fas fa-edit mr-1"></i>
          Edit
        </button>
      </div>
    </div>
  );
}
