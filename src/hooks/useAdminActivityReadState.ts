import { useCallback, useState } from "react";
import { getReadActivityIds, markActivityIdsRead } from "@/lib/admin-activity-read";

export function useAdminActivityReadState() {
  const [readSet, setReadSet] = useState(() => new Set(getReadActivityIds()));

  const refreshFromStorage = useCallback(() => {
    setReadSet(new Set(getReadActivityIds()));
  }, []);

  const markRead = useCallback((id: string) => {
    markActivityIdsRead([id]);
    refreshFromStorage();
  }, [refreshFromStorage]);

  const markAllRead = useCallback((ids: string[]) => {
    markActivityIdsRead(ids);
    refreshFromStorage();
  }, [refreshFromStorage]);

  return { readSet, markRead, markAllRead, refreshFromStorage };
}
