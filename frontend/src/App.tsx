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
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import LowStock from "./pages/LowStock";
import POS from "./pages/POS";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const ModuleRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const selectedModule = localStorage.getItem("selectedModule");
  
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (!selectedModule) return <Navigate to="/modules" />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            <Route path="products" element={<Products />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="low-stock" element={<LowStock />} />
            <Route path="pos" element={<POS />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
