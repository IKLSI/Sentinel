import type React from "react";
import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DEMO_PATHS } from "@/features/landing/demo/constants";
import { FindingActionsContext } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";

interface Props {
  projectId: string;
  children: React.ReactNode;
}

export const DemoFindingActions: React.FC<Props> = ({
  projectId,
  children,
}) => {
  const navigate = useNavigate();

  const value = useMemo(
    () => ({
      projectId,
      createTicket: () => navigate({ to: DEMO_PATHS.tickets }),
      creatingFindingKey: null,
      removeSuppression: () => {},
      removingSuppressionId: null,
    }),
    [projectId, navigate],
  );

  return (
    <FindingActionsContext.Provider value={value}>
      {children}
    </FindingActionsContext.Provider>
  );
};
