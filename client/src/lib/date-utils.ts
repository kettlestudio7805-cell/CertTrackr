import { differenceInDays, isPast, formatDistanceToNow } from "date-fns";

export function getCertificateStatus(expiryDate: Date) {
  const isExpired = isPast(expiryDate);
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

  if (isExpired) {
    return {
      status: "expired",
      label: "Expired",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: "fa-exclamation-circle",
      borderColor: "border-red-200 dark:border-red-800",
      daysOverdue: Math.abs(daysUntilExpiry),
    };
  } else if (isExpiringSoon) {
    return {
      status: "expiring",
      label: `${daysUntilExpiry} days`,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: "fa-clock",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      daysRemaining: daysUntilExpiry,
    };
  } else {
    return {
      status: "valid",
      label: "Valid",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: "fa-check-circle",
      borderColor: "border-gray-200 dark:border-gray-700",
      daysRemaining: daysUntilExpiry,
    };
  }
}

export function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}
