import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnifiedTicket,
  listUnifiedTickets,
  updateUnifiedTicket,
  unifiedTicketDetailQueryKey,
  unifiedTicketsListQueryKey,
  unifiedTicketsQueryKeyRoot,
} from "@/api/unifiedTickets";

export function useUnifiedTicketsListQuery() {
  return useQuery({
    queryKey: unifiedTicketsListQueryKey,
    queryFn: () => listUnifiedTickets(),
    staleTime: 30_000,
  });
}

export function useUnifiedTicketDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: unifiedTicketDetailQueryKey(id),
    queryFn: () => getUnifiedTicket(id),
    enabled: enabled && id > 0,
  });
}

export function useUpdateUnifiedTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { action?: string; admin_notes?: string | null } }) =>
      updateUnifiedTicket(id, body),
    onSuccess: (data, { id }) => {
      qc.setQueryData(unifiedTicketDetailQueryKey(id), data);
      qc.invalidateQueries({ queryKey: unifiedTicketsQueryKeyRoot });
    },
  });
}
