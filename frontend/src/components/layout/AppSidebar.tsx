import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Package,
    FileText,
    FolderTree,
    Warehouse,
    Receipt,
    Users,
    TrendingUp,
    Ruler,
    TableProperties,
    Hotel,
    Settings,
    ChevronRight,
    ChevronDown,
    Building2,
    DollarSign,
    LucideIcon,
    ShoppingCart,
    ClipboardList,
    Wrench,
    Printer as PrinterIcon,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import resturentLogo from "@/assets/images/village-bar-logo.png";
import { cn } from "@/lib/utils";

// Define menu item type
interface MenuItem {
    title: string;
    url: string;
    icon?: LucideIcon;
}

// Define menu group type
interface MenuGroup {
    title: string;
    icon: LucideIcon;
    items: MenuItem[];
}

// Hotel Management Menu Groups (excluding POS)
const hotelMenuGroups: MenuGroup[] = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        items: [
            { title: "Overview", url: "/dashboard" },
            { title: "P&L (Profit & Loss)", url: "/profit-and-loss", icon: TrendingUp },
        ],
    },
    {
        title: "Hotel Management",
        icon: Hotel,
        items: [
            { title: "Room Types", url: "/room-types", icon: Hotel },
            { title: "Rooms", url: "/rooms", icon: Hotel },
            { title: "Room Status", url: "/room-status", icon: Building2 },
            { title: "Tables", url: "/tables", icon: TableProperties },
            { title: "Table Status", url: "/table-status", icon: TableProperties },
        ],
    },
    {
        title: "Inventory",
        icon: Package,
        items: [
            { title: "Categories", url: "/categories", icon: FolderTree },
            { title: "Units", url: "/units", icon: Ruler },
            { title: "Products", url: "/products", icon: Package },
            { title: "Stock", url: "/my-stock", icon: Warehouse },
        ],
    },
    {
        title: "Transactions",
        icon: DollarSign,
        items: [
            { title: "Invoices", url: "/invoices", icon: FileText },
            { title: "Bills", url: "/bills", icon: Receipt },
        ],
    },
    {
        title: "Settings",
        icon: Settings,
        items: [
            { title: "Users", url: "/users", icon: Users },
            { title: "Service Fees", url: "/settings", icon: Settings },
            { title: "Tools", url: "/tools", icon: Wrench },
            { title: "Printer Setup", url: "/printer-setup", icon: PrinterIcon },
        ],
    },
];

// POS Module Menu Items (Simple flat list - no grouping)
const posItems = [
    { title: "POS System", url: "/pos", icon: ShoppingCart },
    { title: "Orders", url: "/orders", icon: ClipboardList },
    { title: "Room Status", url: "/room-status", icon: Hotel },
    { title: "Table Status", url: "/table-status", icon: TableProperties },
    { title: "Bills", url: "/bills", icon: Receipt },
];

// Collapsible Menu Group Component
function CollapsibleMenuGroup({ group }: { group: MenuGroup }) {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if any item in the group is active
    const isGroupActive = group.items.some((item) => location.pathname === item.url);

    // Auto-expand if group contains active item
    useEffect(() => {
        if (isGroupActive) {
            setIsExpanded(true);
        }
    }, [isGroupActive]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="mb-1">
            {/* Group Header */}
            <button
                onClick={toggleExpand}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "font-medium text-sm",
                    isGroupActive && "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                )}
            >
                <group.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{group.title}</span>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                )}
            </button>

            {/* Submenu Items with Smooth Animation */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="pl-11 pr-3 py-1 space-y-0.5">
                    {group.items.map((item) => {
                        const isActive = location.pathname === item.url;
                        const ItemIcon = item.icon;

                        return (
                            <NavLink
                                key={item.url}
                                to={item.url}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200",
                                    "text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                                )}
                            >
                                {ItemIcon && <ItemIcon className="h-4 w-4 shrink-0" />}
                                <span>{item.title}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function AppSidebar() {
    const location = useLocation();
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const { state } = useSidebar();

    useEffect(() => {
        const module = localStorage.getItem("selectedModule");
        setSelectedModule(module);
    }, [location]);

    const isPOSModule = selectedModule === "pos";
    const moduleLabel = isPOSModule ? "POS Module" : "Hotel Management";

    return (
        <Sidebar className="border-r">
            <SidebarContent>
                {/* Header Section */}
                <div className="p-4 md:p-6 border-b bg-sidebar">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-transparent flex items-center justify-centeroverflow-hidden ">
                            <img src={resturentLogo} alt="Tissa Village Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <div>
                            <h1 className="font-bold text-base md:text-lg text-foreground">Tissa Village</h1>
                            <p className="text-xs text-muted-foreground">{moduleLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Groups */}
                <SidebarGroup className="px-3 py-4">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isPOSModule ? (
                                // POS Module - Simple flat menu (no collapsible groups)
                                posItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <NavLink
                                            to={item.url}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                "font-medium text-sm",
                                                location.pathname === item.url && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuItem>
                                ))
                            ) : (
                                // SFA Module - Collapsible grouped menu
                                hotelMenuGroups.map((group) => (
                                    <SidebarMenuItem key={group.title}>
                                        <CollapsibleMenuGroup group={group} />
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-3 border-t bg-sidebar/50 backdrop-blur-sm">
                <div className={cn(
                    "flex items-center text-xs text-muted-foreground transition-all duration-200",
                    state === "collapsed" ? "justify-center" : "justify-between"
                )}>
                    {state !== "collapsed" && <span className="font-medium tracking-wide text-muted-foreground/75">System Version</span>}
                    <span className={cn(
                        "px-2 py-0.5 rounded-full bg-muted font-mono font-semibold text-foreground/80 border border-border/50",
                        state === "collapsed" && "text-[10px] px-1"
                    )}>
                        v{__APP_VERSION__}
                    </span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
