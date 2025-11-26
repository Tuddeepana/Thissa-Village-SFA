import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wine,
  Package,
  FileText,
  AlertCircle,
  ShoppingCart,
  FolderTree,
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
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Low Stock", url: "/low-stock", icon: AlertCircle },
];

const posItems = [
  { title: "POS System", url: "/pos", icon: ShoppingCart },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
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
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-foreground">VinoPro</h1>
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
