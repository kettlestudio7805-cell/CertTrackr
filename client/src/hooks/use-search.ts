import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Certificate } from "@shared/schema";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates/search", { q: debouncedQuery }],
    enabled: !!debouncedQuery.trim(),
    queryFn: () => {
      if (!debouncedQuery.trim()) return [];
      
      const params = new URLSearchParams({ q: debouncedQuery });
      return fetch(`/api/certificates/search?${params}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Search failed');
          return res.json();
        });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    searchResults: debouncedQuery ? searchResults : null,
    isSearching: debouncedQuery ? isSearching : false,
  };
}
