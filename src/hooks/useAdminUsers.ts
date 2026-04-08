import {
  useMutation,
  useQuery,
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
  userDetailQueryKey,
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
    mutationFn: (id: number) => toggleUserVerification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersQueryKeyRoot });
    },
  });
}
