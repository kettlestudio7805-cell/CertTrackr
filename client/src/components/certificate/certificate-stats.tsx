import { useQuery } from "@tanstack/react-query";

interface CertificateStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
}

export default function CertificateStats() {
  const { data: stats, isLoading } = useQuery<CertificateStats>({
    queryKey: ["/api/certificates/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Certificates",
      value: stats?.total || 0,
      icon: "fa-certificate",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      testId: "stats-total"
    },
    {
      label: "Valid",
      value: stats?.valid || 0,
      icon: "fa-check-circle",
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      testId: "stats-valid"
    },
    {
      label: "Expiring Soon",
      value: stats?.expiring || 0,
      icon: "fa-exclamation-triangle",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      testId: "stats-expiring"
    },
    {
      label: "Expired",
      value: stats?.expired || 0,
      icon: "fa-times-circle",
      bgColor: "bg-red-100 dark:bg-red-900",
      iconColor: "text-red-600 dark:text-red-400",
      testId: "stats-expired"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" data-testid={item.testId}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`fas ${item.icon} ${item.iconColor}`}></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
