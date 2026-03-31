import { NavLink } from "@/components/NavLink";
import logo from "@/assets/images/village-bar-logo.png";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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

const sfaItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Categories", url: "/categories", icon: FolderTree },
  { title: "Products", url: "/products", icon: Package },
  { title: "My Stock", url: "/my-stock", icon: Warehouse },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Bills", url: "/bills", icon: Receipt },
  { title: "Sales Summary", url: "/sales-summary", icon: TrendingUp },
  { title: "Users", url: "/users", icon: Users },
];

const posItems = [
  { title: "POS System", url: "/pos", icon: ShoppingCart },
  { title: "Bills", url: "/bills", icon: Receipt },
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
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={logo} alt="Village Bar Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-foreground">Village Bar</h1>
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
                      <item.icon className="h-4 w-4" />
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
