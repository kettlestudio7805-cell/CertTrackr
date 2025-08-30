import { useQuery } from "@tanstack/react-query";
import { Certificate, SearchCertificatesParams } from "@shared/schema";

export function useCertificates(params?: Partial<SearchCertificatesParams>) {
  const queryParams = new URLSearchParams();
  
  if (params?.status) queryParams.set("status", params.status);
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());

  const { data: certificates, isLoading, error, refetch } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", queryParams.toString()],
    queryFn: () => {
      const url = `/api/certificates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return fetch(url, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch certificates');
          return res.json();
        });
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  return {
    certificates,
    isLoading,
    error,
    refetch,
  };
}

export function useCertificate(id: string) {
  const { data: certificate, isLoading, error } = useQuery<Certificate>({
    queryKey: ["/api/certificates", id],
    enabled: !!id,
  });

  return {
    certificate,
    isLoading,
    error,
  };
}
