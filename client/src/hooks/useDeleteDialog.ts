import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";
import { useUndoToast } from "@/hooks/useUndoToast";

interface DeferredDeletion<T> {
  hide: (target: T) => void;
  restore: () => void;
}

export function useDeleteDialog<T extends { id: string }>(
  mutation: UseMutationResult<void, Error, { id: string }>,
  errorKey: string,
  successMessage: (target: T) => string,
  deferred?: DeferredDeletion<T>,
) {
  const { showToast } = useToast();
  const showUndoToast = useUndoToast();
  const onError = useApiErrorToast(errorKey);
  const [target, setTarget] = useState<T | null>(null);

  const closeDialog = useCallback(() => setTarget(null), []);

  const confirm = () => {
    if (!target) return;
    const deleted = target;
    if (deferred) {
      setTarget(null);
      deferred.hide(deleted);
      showUndoToast(successMessage(deleted), deferred.restore, {
        onExpire: () =>
          mutation.mutateAsync({ id: deleted.id }).catch((err) => {
            deferred.restore();
            onError(err);
          }),
      });
      return;
    }
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
