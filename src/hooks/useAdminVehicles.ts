import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  listVehicles,
  vehiclesQueryKeyRoot,
  vehiclesListQueryKey,
  updateVehicle,
  type VehiclesListParams,
} from "@/api/vehicles";

export function useVehiclesListQuery(params: VehiclesListParams) {
  return useQuery({
    queryKey: vehiclesListQueryKey(params),
    queryFn: () => listVehicles(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateVehicleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateVehicleBody }) => updateVehicle(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehiclesQueryKeyRoot });
    },
  });
}

/** Admin: vehicles owned by a single user (drawer / profile). */
export function useVehiclesForUserQuery(userId: number | null, enabled: boolean) {
  const params: VehiclesListParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      orderBy: "id",
      order: "DESC",
      userId: userId ?? undefined,
    }),
    [userId]
  );
  return useQuery({
    queryKey: vehiclesListQueryKey(params),
    queryFn: () => listVehicles(params),
    enabled: enabled && userId != null,
  });
}
