import type React from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { DeleteModal } from "@/components/ui/common/modal/DeleteModal";
import { ListSkeleton } from "@/components/ui/common/feedback/ListSkeleton";
import { LoadingRegion } from "@/components/ui/common/feedback/LoadingRegion";
import { PageContainer } from "@/components/layout/PageContainer";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/contexts/I18nContext";
import { useTicketQuery } from "@/domains/tickets/queries";
import { DETAIL_PALETTE } from "@/features/tickets/pages/TicketDetailPage/constants";
import { useTicketComments } from "@/features/tickets/pages/TicketDetailPage/hooks";
import { SectionDivider } from "@/features/tickets/pages/TicketDetailPage/components/SectionDivider";
import { CommentItem } from "@/features/tickets/pages/TicketDetailPage/components/CommentItem";
import { CommentComposer } from "@/features/tickets/pages/TicketDetailPage/components/CommentComposer";
import { PropertiesCard } from "@/features/tickets/pages/TicketDetailPage/components/PropertiesCard";
import { HistoryCard } from "@/features/tickets/pages/TicketDetailPage/components/HistoryCard";

const routeApi = getRouteApi("/_authenticated/tickets/$id");

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const { id } = routeApi.useParams();
  const { user } = useAuth();

  const ticketQuery = useTicketQuery(id);
  const ticket = ticketQuery.data ?? null;
  const notFound = ticketQuery.isError;
  const comments = useTicketComments(id ?? "", ticket);

  useQueryErrorToast(notFound, "tickets.detail.not_found_toast");

  if (ticketQuery.isLoading) {
    return (
      <LoadingRegion
        label={t("tickets.detail.loading")}
        sx={{ p: "24px 32px", maxWidth: 960 }}
      >
        <Skeleton
          variant="rounded"
          width={220}
          height={20}
          sx={{ mb: "16px" }}
        />
        <Skeleton variant="rounded" height={36} sx={{ mb: "24px" }} />
        <ListSkeleton rows={4} rowHeight={72} />
      </LoadingRegion>
    );
  }

  if (notFound || !ticket) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: "80px",
          gap: "8px",
        }}
      >
        <Box
          sx={{
            fontSize: "40px",
            fontWeight: 800,
            color: "var(--border2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          404
        </Box>
        <Box sx={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
          {t("tickets.detail.not_found_title")}
        </Box>
        <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
          {t("tickets.detail.not_found_subtitle")}
        </Box>
      </Box>
    );
  }

  const ticketComments = ticket.comments ?? [];

  return (
    <>
      <PageContainer
        sx={{
          p: { xs: "20px 8px", md: "20px 28px" },
          height: "auto",
          minHeight: "100vh",
          gap: "14px",
          alignItems: "flex-start",
          flexDirection: { xs: "column", lg: "row" },
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            background: DETAIL_PALETTE.panelBg,
            border: `1px solid ${DETAIL_PALETTE.panelBorder}`,
            borderRadius: "var(--r-xl)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: DETAIL_PALETTE.panelShadow,
          }}
        >
          <Box
            sx={{
              px: { xs: "24px", md: "40px" },
              pt: { xs: "24px", md: "36px" },
              pb: 0,
            }}
          >
            <Box
              component="h1"
              sx={{
                m: 0,
                mt: "4px",
                mb: "0px",
                fontSize: { xs: "18px", md: "24px" },
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: DETAIL_PALETTE.title,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {ticket.title}
            </Box>
          </Box>

          <Box
            sx={{
              px: { xs: "24px", md: "40px" },
              pt: { xs: "24px", md: "36px" },
              pb: { xs: "18px", md: "24px" },
            }}
          >
            {ticket.description && (
              <>
                <SectionDivider
                  icon={<DescriptionOutlined sx={{ fontSize: 13 }} />}
                  label={t("tickets.detail.section_description")}
                />

                <Box>
                  <Box
                    sx={{
                      fontSize: "13px",
                      color: DETAIL_PALETTE.bodyText,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {ticket.description}
                  </Box>
                </Box>
              </>
            )}

            <SectionDivider
              icon={<ForumOutlined sx={{ fontSize: 13 }} />}
              label={t("tickets.detail.section_conversation")}
              my="28px"
            />

            <Box sx={{ position: "relative" }}>
              {ticketComments.map((c, idx) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isLast={idx === ticketComments.length - 1}
                  isOwn={user?.id === c.authorId}
                  isEditing={comments.editingCommentId === c.id}
                  onEdit={comments.startEditComment}
                  onDelete={comments.setDeleteCommentTarget}
                />
              ))}

              {ticketComments.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    py: "32px",
                    color: DETAIL_PALETTE.emptyFg,
                  }}
                >
                  <ForumOutlined sx={{ fontSize: 28, opacity: 0.4 }} />
                  <Box sx={{ fontSize: "13px", fontWeight: 500 }}>
                    {t("tickets.detail.no_comments_title")}
                  </Box>
                  <Box
                    sx={{ fontSize: "12px", color: DETAIL_PALETTE.emptySub }}
                  >
                    {t("tickets.detail.no_comments_subtitle")}
                  </Box>
                </Box>
              )}
            </Box>

            <CommentComposer
              ticketId={id ?? ""}
              value={comments.composerValue}
              onValueChange={comments.setComposerValue}
              attachments={comments.composerAttachments}
              onAttachmentsChange={comments.setComposerAttachments}
              submitting={comments.submitting}
              onSubmit={comments.handleSubmitComment}
              editingCommentId={comments.editingCommentId}
              onCancelEdit={comments.cancelEditComment}
            />
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: "270px" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minHeight: 0,
          }}
        >
          <PropertiesCard ticket={ticket} />

          <HistoryCard ticket={ticket} />
        </Box>
      </PageContainer>

      <DeleteModal
        open={!!comments.deleteCommentTarget}
        onClose={() => comments.setDeleteCommentTarget(null)}
        onConfirm={comments.handleDeleteComment}
        loading={comments.deleting}
        title={t("tickets.detail.delete_comment_title")}
        irreversible
      >
        {t("tickets.detail.delete_comment_message")}
      </DeleteModal>
    </>
  );
};
