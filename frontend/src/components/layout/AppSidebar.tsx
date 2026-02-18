import {NavLink} from "@/components/NavLink";
import {useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {
    LayoutDashboard,
    Package,
    FileText,
    ShoppingCart,
    FolderTree,
    Warehouse,
    Receipt,
    Users,
    TrendingUp,
    ClipboardList,
    Ruler,
    TableProperties,
    Hotel,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import logoSvg from "@/img/logo.svg";

const sfaItems = [
    {title: "Dashboard", url: "/dashboard", icon: LayoutDashboard},
    {title: "P&L (Profit & Loss)", url: "/profit-and-loss", icon: TrendingUp},
    {title: "Categories", url: "/categories", icon: FolderTree},
    {title: "Units", url: "/units", icon: Ruler},
    {title: "Products", url: "/products", icon: Package},
    {title: "Tables", url: "/tables", icon: TableProperties},
    {title: "Rooms", url: "/rooms", icon: Hotel},
    {title: "Room Status", url: "/room-status", icon: Hotel},
    {title: "Stock", url: "/my-stock", icon: Warehouse},
    {title: "Invoices", url: "/invoices", icon: FileText},
    {title: "Bills", url: "/bills", icon: Receipt},
    {title: "Users", url: "/users", icon: Users},
];

const posItems = [
    {title: "POS System", url: "/pos", icon: ShoppingCart},
    {title: "Orders", url: "/orders", icon: ClipboardList},
    {title: "Room Status", url: "/room-status", icon: Hotel},
    {title: "Bills", url: "/bills", icon: Receipt},
];

export function AppSidebar() {
    const location = useLocation();
    const [selectedModule, setSelectedModule] = useState<string | null>(null);

    useEffect(() => {
        const module = localStorage.getItem("selectedModule");
        setSelectedModule(module);
    }, [location]);

    const items = selectedModule === "pos" ? posItems : sfaItems;
    const moduleLabel = selectedModule === "pos" ? "POS Module" : "SFA Module";

    return (
        <Sidebar className="border-r">
            <SidebarContent>
                <div className="p-4 md:p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <img src={logoSvg} alt="Tissa Village Logo" className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-base md:text-lg text-foreground">Tissa Village</h1>
                            <p className="text-xs text-muted-foreground">{moduleLabel}</p>
                        </div>
                    </div>
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        >
                                            <item.icon className="h-4 w-4"/>
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
