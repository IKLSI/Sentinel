import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRemoveSuppressionMutation } from "@/domains/projects/mutations";
import { useCreateTicketFromFindingMutation } from "@/domains/tickets/mutations";
import type { FindingKind } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";

interface FindingActions {
  createTicket: (kind: FindingKind, findingKey: string) => void;
  creatingFindingKey: string | null;
  removeSuppression: (suppressionId: string) => void;
  removingSuppressionId: string | null;
}

export const FindingActionsContext = createContext<FindingActions | null>(null);

export const FindingActionsProvider: React.FC<{
  projectId: string;
  children: React.ReactNode;
}> = ({ projectId, children }) => {
  const t = useT();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createMutation = useCreateTicketFromFindingMutation();
  const removeMutation = useRemoveSuppressionMutation();
  const onCreateError = useApiErrorToast("tech_health.ticket.create_error");
  const onRemoveError = useApiErrorToast("tech_health.suppression.error");

  const createTicketMutate = createMutation.mutate;
  const removeSuppressionMutate = removeMutation.mutate;

  const createTicket = useCallback(
    (kind: FindingKind, findingKey: string) =>
      createTicketMutate(
        { data: { projectId, kind, findingKey } },
        {
          onSuccess: (ticket) =>
            showToast(
              t("tickets.list.create_success", { reference: ticket.reference }),
              "success",
              {
                label: t("common.view"),
                onClick: () =>
                  navigate({ to: "/tickets/$id", params: { id: ticket.id } }),
              },
            ),
          onError: onCreateError,
        },
      ),
    [createTicketMutate, projectId, navigate, onCreateError, showToast, t],
  );

  const removeSuppression = useCallback(
    (suppressionId: string) =>
      removeSuppressionMutate(
        { id: projectId, suppressionId },
        {
          onSuccess: () =>
            showToast(t("tech_health.suppression.reactivated"), "success"),
          onError: onRemoveError,
        },
      ),
    [removeSuppressionMutate, projectId, onRemoveError, showToast, t],
  );

  const creatingFindingKey = createMutation.isPending
    ? (createMutation.variables?.data.findingKey ?? null)
    : null;
  const removingSuppressionId = removeMutation.isPending
    ? (removeMutation.variables?.suppressionId ?? null)
    : null;

  const value = useMemo(
    () => ({
      createTicket,
      creatingFindingKey,
      removeSuppression,
      removingSuppressionId,
    }),
    [
      createTicket,
      creatingFindingKey,
      removeSuppression,
      removingSuppressionId,
    ],
  );

  return (
    <FindingActionsContext.Provider value={value}>
      {children}
    </FindingActionsContext.Provider>
  );
};

export const useFindingActions = (): FindingActions => {
  const context = useContext(FindingActionsContext);
  if (!context)
    throw new Error(
      "useFindingActions doit être utilisé dans un FindingActionsProvider",
    );
  return context;
};
