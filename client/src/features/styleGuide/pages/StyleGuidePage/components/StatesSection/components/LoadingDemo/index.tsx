import type React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import { TableSkeletonRows } from "@/components/ui/common/table/TableSkeletonRows";
import { useT } from "@/contexts/I18nContext";
import {
  TABLE_HEAD_KEYS,
  TABLE_SKELETON_CELLS,
  TABLE_SKELETON_ROWS,
} from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/constants";
import { PANEL_SX } from "@/helpers/cardSx";

export const LoadingDemo: React.FC = () => {
  const t = useT();

  return (
    <Box
      aria-busy="true"
      sx={{ ...PANEL_SX, position: "relative", overflow: "hidden" }}
    >
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            {TABLE_HEAD_KEYS.map((key) => (
              <SortableTh key={key}>{t(key)}</SortableTh>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableSkeletonRows
            cells={TABLE_SKELETON_CELLS}
            rows={TABLE_SKELETON_ROWS}
          />
        </TableBody>
      </Table>
      <LoadingStatus label={t("tickets.list.loading")} />
    </Box>
  );
};
