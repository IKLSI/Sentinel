import HomeOutlined from "@mui/icons-material/HomeOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import FavoriteBorderOutlined from "@mui/icons-material/FavoriteBorderOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadOutlined from "@mui/icons-material/UploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";

export const TYPE_SCALE = [
  { key: "3xs", rem: "0.5rem" },
  { key: "2xs", rem: "0.625rem" },
  { key: "xs", rem: "0.75rem" },
  { key: "sm", rem: "0.875rem" },
  { key: "base", rem: "1rem" },
  { key: "lg", rem: "1.125rem" },
  { key: "xl", rem: "1.25rem" },
  { key: "2xl", rem: "1.5rem" },
  { key: "3xl", rem: "1.875rem" },
  { key: "4xl", rem: "2.25rem" },
] as const;

export const WEIGHTS = [
  { label: "Regular", weight: 400 },
  { label: "Medium", weight: 500 },
  { label: "Semibold", weight: 600 },
  { label: "Bold", weight: 700 },
] as const;

export const SURFACE_TOKENS = [
  "bg",
  "s1",
  "s2",
  "s3",
  "border",
  "border2",
] as const;
export const TEXT_TOKENS = [
  "text",
  "text-secondary",
  "muted",
  "muted2",
] as const;
export const SEMANTIC_TOKENS = [
  { name: "accent", desc: "primary" },
  { name: "accent-fill", desc: "primary fill" },
  { name: "green", desc: "success" },
  { name: "green-fill", desc: "success fill" },
  { name: "yellow", desc: "warning" },
  { name: "orange", desc: "orange" },
  { name: "red", desc: "destructive" },
  { name: "red-fill", desc: "destructive fill" },
  { name: "cyan", desc: "cyan" },
  { name: "purple", desc: "purple" },
] as const;

export const RADII = [
  { key: "r-xs", label: "xs · 4px" },
  { key: "r-sm", label: "sm · 6px" },
  { key: "r", label: "base · 8px" },
  { key: "r-md", label: "md · 12px" },
  { key: "r-lg", label: "lg · 16px" },
  { key: "r-xl", label: "xl · 20px" },
] as const;

export const SPACING = [
  { label: "1", px: 4 },
  { label: "2", px: 8 },
  { label: "3", px: 12 },
  { label: "4", px: 16 },
  { label: "6", px: 24 },
  { label: "8", px: 32 },
  { label: "10", px: 40 },
  { label: "12", px: 48 },
] as const;

export const ICONS = [
  { Icon: HomeOutlined, name: "Home" },
  { Icon: PersonOutlined, name: "User" },
  { Icon: SettingsOutlined, name: "Settings" },
  { Icon: SearchOutlined, name: "Search" },
  { Icon: NotificationsNoneOutlined, name: "Bell" },
  { Icon: FavoriteBorderOutlined, name: "Heart" },
  { Icon: StarBorderOutlined, name: "Star" },
  { Icon: MailOutlineOutlined, name: "Mail" },
  { Icon: AddOutlined, name: "Plus" },
  { Icon: CheckOutlined, name: "Check" },
  { Icon: CloseOutlined, name: "Close" },
  { Icon: WarningAmberOutlined, name: "Warning" },
  { Icon: InfoOutlined, name: "Info" },
  { Icon: ArrowForwardOutlined, name: "Arrow" },
  { Icon: DownloadOutlined, name: "Download" },
  { Icon: UploadOutlined, name: "Upload" },
  { Icon: DeleteOutlined, name: "Delete" },
  { Icon: EditOutlined, name: "Edit" },
  { Icon: VisibilityOutlined, name: "Eye" },
  { Icon: ContentCopyOutlined, name: "Copy" },
  { Icon: ShareOutlined, name: "Share" },
  { Icon: FilterListOutlined, name: "Filter" },
  { Icon: MoreHorizOutlined, name: "More" },
  { Icon: ChevronRightOutlined, name: "Chevron" },
] as const;
