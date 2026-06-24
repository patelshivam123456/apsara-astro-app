import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getAstrologers } from "@/services/astrologer.service";

export function useAstrologers() {
  return useQuery({
    queryKey: ["astrologers"],
    queryFn: getAstrologers
  });
}

export function usePaginatedAstrologers(pageSize = 8) {
  return useInfiniteQuery({
    queryKey: ["astrologers", "infinite", pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const all = await getAstrologers();
      const start = pageParam * pageSize;
      return {
        items: all.slice(start, start + pageSize),
        nextPage: start + pageSize < all.length ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage
  });
}
