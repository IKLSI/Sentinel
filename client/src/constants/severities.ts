import { TicketPriority, VulnerabilitySeverity } from "@/enums";

export const SEVERITY_TONES: Record<VulnerabilitySeverity, string> = {
  [VulnerabilitySeverity.Critical]: "var(--red)",
  [VulnerabilitySeverity.High]: "var(--orange)",
  [VulnerabilitySeverity.Medium]: "var(--yellow)",
  [VulnerabilitySeverity.Low]: "var(--slate)",
};

export const PRIORITY_TONES: Record<TicketPriority, string> = {
  [TicketPriority.Critical]: SEVERITY_TONES.Critical,
  [TicketPriority.High]: SEVERITY_TONES.High,
  [TicketPriority.Medium]: SEVERITY_TONES.Medium,
  [TicketPriority.Low]: SEVERITY_TONES.Low,
};
