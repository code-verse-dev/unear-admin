import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  setUserPassword,
  toggleUserVerification,
  usersQueryKeyRoot,
  usersListQueryKey,
  usersInfiniteListQueryKey,
  userDetailQueryKey,
  USERS_INFINITE_PAGE_SIZE,
  type UsersListParams,
  type UpdateUserBody,
  type AppUser,
  type UsersListResult,
} from "@/api/users";

function mergeUserOptimistic(user: AppUser, body: UpdateUserBody): AppUser {
  const patch = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined)
  ) as Partial<AppUser>;
  return { ...user, ...patch };
}

export function useUsersListQuery(params: UsersListParams) {
  return useQuery({
    queryKey: usersListQueryKey(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

/** Pending profile-approval count for the sidebar badge. */
export function usePendingUsersCountQuery() {
  return useQuery({
    queryKey: [...usersQueryKeyRoot, "pending-count"] as const,
    queryFn: async () => {
      const r = await listUsers({
        page: 1,
        limit: 1,
        verification: "pending",
        orderBy: "id",
        order: "ASC",
      });
      return Number(r.links?.total_records) || 0;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/** Paginated users for pickers; load more with `fetchNextPage` (e.g. on scroll). */
export function useUsersInfiniteListQuery(debouncedSearch: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: usersInfiniteListQueryKey(debouncedSearch),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listUsers({
        page: pageParam as number,
        limit: USERS_INFINITE_PAGE_SIZE,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        orderBy: "id",
        order: "ASC",
      }),
    getNextPageParam: (lastPage) => {
      const links = lastPage.links;
      if (!links?.total) return undefined;
      if (links.current >= links.total) return undefined;
      return links.current + 1;
    },
    enabled,
  });
}

export function useUserDetailQuery(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: id != null ? userDetailQueryKey(id) : ["admin", "users", "detail", "none"],
    queryFn: () => getUser(id!),
    enabled: enabled && id != null,
  });
}

type UpdateUserContext = {
  previousLists: [readonly unknown[], UsersListResult | undefined][];
  previousDetail: AppUser | undefined;
};

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      avatarFile,
    }: {
      id: number;
      body: UpdateUserBody;
      avatarFile?: File | null;
    }) => updateUser(id, body, avatarFile),

    onMutate: async ({ id, body }): Promise<UpdateUserContext> => {
      await qc.cancelQueries({ queryKey: usersQueryKeyRoot });
      await qc.cancelQueries({ queryKey: userDetailQueryKey(id) });

      const previousLists = qc.getQueriesData<UsersListResult>({ queryKey: usersQueryKeyRoot });
      const previousDetail = qc.getQueryData<AppUser>(userDetailQueryKey(id));

      qc.setQueriesData<UsersListResult>({ queryKey: usersQueryKeyRoot }, (old) => {
        if (!old?.rows?.length) return old;
        return {
          ...old,
          rows: old.rows.map((u) => (u.id === id ? mergeUserOptimistic(u, body) : u)),
        };
      });

      qc.setQueryData<AppUser>(userDetailQueryKey(id), (old) =>
        old ? mergeUserOptimistic(old, body) : old
      );

      return { previousLists, previousDetail };
    },

    onError: (_err, { id }, context) => {
      if (!context) return;
      context.previousLists.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      qc.setQueryData(userDetailQueryKey(id), context.previousDetail);
    },

    onSuccess: (updated, { id }) => {
      qc.setQueriesData<UsersListResult>({ queryKey: usersQueryKeyRoot }, (old) => {
        if (!old?.rows?.length) return old;
        return {
          ...old,
          rows: old.rows.map((u) => (u.id === id ? updated : u)),
        };
      });
      qc.setQueryData(userDetailQueryKey(id), updated);
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}

export function useBlockUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blockUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}

export function useUnblockUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unblockUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}

export function useSetUserPasswordMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, new_password }: { id: number; new_password: string }) =>
      setUserPassword(id, new_password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}

export function useToggleUserVerificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_verified }: { id: number; is_verified?: boolean }) =>
      toggleUserVerification(id, is_verified),
    onSuccess: (_data, { id, is_verified }) => {
      if (is_verified !== undefined) {
        qc.setQueryData<AppUser>(userDetailQueryKey(id), (old) =>
          old ? { ...old, is_verified } : old
        );
        qc.setQueriesData<UsersListResult>({ queryKey: usersQueryKeyRoot }, (old) => {
          if (!old?.rows?.length) return old;
          return {
            ...old,
            rows: old.rows.map((u) => (u.id === id ? { ...u, is_verified } : u)),
          };
        });
      }
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}
