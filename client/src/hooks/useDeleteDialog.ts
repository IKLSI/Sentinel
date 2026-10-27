import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";

export function useDeleteDialog<T extends { id: string }>(
  mutation: UseMutationResult<void, Error, { id: string }>,
  errorKey: string,
  successMessage: (target: T) => string,
) {
  const { showToast } = useToast();
  const onError = useApiErrorToast(errorKey);
  const [target, setTarget] = useState<T | null>(null);

  const closeDialog = useCallback(() => setTarget(null), []);

  const confirm = () => {
    if (!target) return;
    const deleted = target;
    mutation.mutate(
      { id: deleted.id },
      {
        onSuccess: () => {
          setTarget(null);
          showToast(successMessage(deleted), "success");
        },
        onError,
      },
    );
  };

  return {
    target,
    setTarget,
    closeDialog,
    confirm,
    deleting: mutation.isPending,
  };
}
