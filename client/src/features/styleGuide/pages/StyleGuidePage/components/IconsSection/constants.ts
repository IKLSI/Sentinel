import type { SvgIconComponent } from "@mui/icons-material";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";

const entry = (name: string, Icon: SvgIconComponent, meaning: string) => ({
  name,
  Icon,
  meaningKey: `style_guide.icons.meaning.${meaning}`,
});

export const ICONS = [
  entry("Dashboard", DashboardOutlined, "dashboard"),
  entry("AccountTree", AccountTreeOutlined, "projects"),
  entry("ConfirmationNumber", ConfirmationNumberOutlined, "tickets"),
  entry("Person", PersonOutlined, "profile"),
  entry("Settings", SettingsOutlined, "settings"),
  entry("ChevronRight", ChevronRightOutlined, "drill_down"),
  entry("KeyboardArrowDown", KeyboardArrowDownOutlined, "expand"),
  entry("OpenInNew", OpenInNewOutlined, "external"),
  entry("Logout", LogoutOutlined, "logout"),
  entry("Add", AddOutlined, "create"),
  entry("Edit", EditOutlined, "edit"),
  entry("DeleteOutline", DeleteOutlineOutlined, "delete"),
  entry("Search", SearchOutlined, "search"),
  entry("FilterList", FilterListOutlined, "filter"),
  entry("Refresh", RefreshOutlined, "rescan"),
  entry("PlayArrow", PlayArrowOutlined, "start"),
  entry("ContentCopy", ContentCopyOutlined, "copy"),
  entry("Download", DownloadOutlined, "export"),
  entry("MoreHoriz", MoreHorizOutlined, "more"),
  entry("Close", CloseOutlined, "close"),
  entry("Check", CheckOutlined, "done"),
  entry("Info", InfoOutlined, "info"),
  entry("WarningAmber", WarningAmberOutlined, "warning"),
  entry("ErrorOutline", ErrorOutlineOutlined, "error"),
  entry("GppBad", GppBadOutlined, "critical"),
  entry("Inventory", InventoryOutlined, "dependencies"),
  entry("Storage", StorageOutlined, "runtimes"),
  entry("Folder", FolderOutlined, "repository"),
  entry("Security", SecurityOutlined, "security_ticket"),
  entry("BugReport", BugReportOutlined, "bug_ticket"),
];
