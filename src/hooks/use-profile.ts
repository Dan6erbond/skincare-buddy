"use client";

import * as queryKeys from "@/lib/query/keys";

import { ID, Permission, Query, Role } from "appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ModelCreate } from "@/lib/appwrite/utils";
import { ProfileFormValues } from "@/lib/schema/profile";
import { Profiles } from "@/lib/appwrite/appwrite";
import { addToast } from "@heroui/react";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";

export const useProfile = () => {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile(user?.$id),
    queryFn: async () => {
      if (!user?.$id) return null;
      const res = await tables.listRows<Profiles>({
        databaseId,
        tableId: tableIds.profiles,
        queries: [Query.equal("userId", user.$id), Query.limit(1)],
      });
      return res.rows[0] || null;
    },

    enabled: !!user?.$id,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.$id) throw new Error("Not authenticated");

      const data = {
        ...values,
        skinIssues: values.skinIssues?.map((i) => i.value) || [],
        userId: user?.$id,
      };

      if (profile?.$id) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.profiles,
          rowId: profile.$id,
          data,
        });
      } else {
        return await tables.createRow<ModelCreate<Profiles>>({
          databaseId,
          tableId: tableIds.profiles,
          rowId: ID.unique(),
          data,
          permissions: [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.$id) });
      addToast({
        title: "Profile Updated",
        description: "Your skin profile has been saved.",
        color: "success",
      });
    },
  });

  return { profile, isLoading, mutate, isMutating: isPending };
};
