import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { useToast } from "@/hooks/useToast";

export const useTicketCreatedToast = () => {
  const t = useT();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useCallback(
    (ticket: Pick<Ticket, "id" | "reference">) =>
      showToast(
        t("tickets.list.create_success", { reference: ticket.reference }),
        "success",
        {
          label: t("common.view"),
          onClick: () =>
            navigate({ to: "/tickets/$id", params: { id: ticket.id } }),
        },
      ),
    [navigate, showToast, t],
  );
};
