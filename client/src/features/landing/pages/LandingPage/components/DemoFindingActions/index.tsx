import type React from "react";
import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DEMO_PATHS } from "@/features/landing/demo/constants";
import { FindingActionsContext } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";

interface Props {
  children: React.ReactNode;
}

export const DemoFindingActions: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();

  const value = useMemo(
    () => ({
      createTicket: () => navigate({ to: DEMO_PATHS.tickets }),
      creatingFindingKey: null,
      removeSuppression: () => {},
      removingSuppressionId: null,
    }),
    [navigate],
  );

  return (
    <FindingActionsContext.Provider value={value}>
      {children}
    </FindingActionsContext.Provider>
  );
};
