import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useRemoveSuppressionMutation,
  useStartRemediationMutation,
} from "@/domains/projects/mutations";
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
  remediationAvailable: boolean;
  startRemediation: (findingKey: string) => void;
  startingRemediationKey: string | null;
}

export const FindingActionsContext = createContext<FindingActions | null>(null);

export const FindingActionsProvider: React.FC<{
  projectId: string;
  remediationAvailable: boolean;
  children: React.ReactNode;
}> = ({ projectId, remediationAvailable, children }) => {
  const t = useT();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const createMutation = useCreateTicketFromFindingMutation();
  const removeMutation = useRemoveSuppressionMutation();
  const remediationMutation = useStartRemediationMutation();
  const onCreateError = useApiErrorToast("tech_health.ticket.create_error");
  const onRemoveError = useApiErrorToast("tech_health.suppression.error");
  const onRemediationError = useApiErrorToast("tech_health.remediation.error");

  const createTicketMutate = createMutation.mutate;
  const removeSuppressionMutate = removeMutation.mutate;
  const startRemediationMutate = remediationMutation.mutate;

  const createTicket = useCallback(
    (kind: FindingKind, findingKey: string) =>
      createTicketMutate(
        { data: { projectId, kind, findingKey } },
        {
          onSuccess: (ticket) =>
            navigate({ to: "/tickets/$id", params: { id: ticket.id } }),
          onError: onCreateError,
        },
      ),
    [createTicketMutate, projectId, navigate, onCreateError],
  );

  const removeSuppression = useCallback(
    (suppressionId: string) =>
      removeSuppressionMutate(
        { id: projectId, suppressionId },
        { onError: onRemoveError },
      ),
    [removeSuppressionMutate, projectId, onRemoveError],
  );

  const startRemediation = useCallback(
    (findingKey: string) =>
      startRemediationMutate(
        { id: projectId, data: { findingKey } },
        {
          onSuccess: () =>
            showToast(t("tech_health.remediation.started"), "success"),
          onError: onRemediationError,
        },
      ),
    [startRemediationMutate, projectId, showToast, t, onRemediationError],
  );

  const creatingFindingKey = createMutation.isPending
    ? (createMutation.variables?.data.findingKey ?? null)
    : null;
  const removingSuppressionId = removeMutation.isPending
    ? (removeMutation.variables?.suppressionId ?? null)
    : null;

  const startingRemediationKey = remediationMutation.isPending
    ? (remediationMutation.variables?.data.findingKey ?? null)
    : null;

  const value = useMemo(
    () => ({
      createTicket,
      creatingFindingKey,
      removeSuppression,
      removingSuppressionId,
      remediationAvailable,
      startRemediation,
      startingRemediationKey,
    }),
    [
      createTicket,
      creatingFindingKey,
      removeSuppression,
      removingSuppressionId,
      remediationAvailable,
      startRemediation,
      startingRemediationKey,
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
