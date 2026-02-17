import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import ModuleSelection from "./pages/ModuleSelection";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Units from "./pages/Units";
import Tables from "./pages/Tables";
import Rooms from "./pages/Rooms";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import LowStock from "./pages/LowStock";
import MyStock from "./pages/MyStock";
import POS from "./pages/POS";
import Orders from "./pages/Orders";
import Bills from "./pages/Bills";
import SalesSummary from "./pages/SalesSummary";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { STORAGE_KEYS } from "./utils/constants";
import { LoadingProvider } from "@/state/loadingProvider";
import GlobalLoaderOverlay from "@/components/common/GlobalLoaderOverlay";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const ModuleRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.isAuthenticated);
  const selectedModule = localStorage.getItem(STORAGE_KEYS.selectedModule);
  
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (!selectedModule) return <Navigate to="/modules" />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LoadingProvider>
        <GlobalLoaderOverlay />
        <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/modules"
            element={
              <ProtectedRoute>
                <ModuleSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ModuleRoute>
                <AppLayout />
              </ModuleRoute>
            }
          >
            <Route index element={<Navigate to="/modules" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="units" element={<Units />} />
            <Route path="tables" element={<Tables />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="products" element={<Products />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="low-stock" element={<LowStock />} />
            <Route path="my-stock" element={<MyStock />} />
            <Route path="pos" element={<POS />} />
            <Route path="orders" element={<Orders />} />
            <Route path="bills" element={<Bills />} />
            <Route path="sales-summary" element={<SalesSummary />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </LoadingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
