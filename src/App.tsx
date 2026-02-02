import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ManagementProvider } from "@/contexts/ManagementContext";
import { usePwaNavigation } from "@/hooks/usePwaNavigation";
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import AdminLogin from "./pages/AdminLogin";
import ManagementDashboard from "./pages/management/ManagementDashboard";
import ClientsPage from "./pages/management/ClientsPage";
import OrdersPage from "./pages/management/OrdersPage";
import FinancialPage from "./pages/management/FinancialPage";
import ProductsPage from "./pages/management/ProductsPage";
import MockupsPage from "./pages/management/MockupsPage";
import CompanyPage from "./pages/management/CompanyPage";
import ReportsPage from "./pages/management/ReportsPage";
import BusinessPage from "./pages/management/BusinessPage";
import UsersPage from "./pages/management/UsersPage";
import TrackingPage from "./pages/management/TrackingPage";
import SitePage from "./pages/management/SitePage";
import CatalogoSettingsPage from "./pages/management/CatalogoSettingsPage";
import TrackingPublic from "./pages/TrackingPublic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle PWA navigation
const PwaNavigationHandler = () => {
  usePwaNavigation();
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <ManagementProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PwaNavigationHandler />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/deep" element={<AdminLogin />} />
                  <Route path="/deep/dashboard" element={<Navigate to="/deep/gestao" replace />} />
                  {/* Management Routes */}
                  <Route path="/deep/gestao" element={<ManagementDashboard />} />
                  <Route path="/deep/gestao/clientes" element={<ClientsPage />} />
                  <Route path="/deep/gestao/pedidos" element={<OrdersPage />} />
                  <Route path="/deep/gestao/rastreio" element={<TrackingPage />} />
                  <Route path="/deep/gestao/financeiro" element={<FinancialPage />} />
                  <Route path="/deep/gestao/produtos" element={<ProductsPage />} />
                  <Route path="/deep/gestao/relatorios" element={<ReportsPage />} />
                  <Route path="/deep/gestao/negocios" element={<BusinessPage />} />
                  <Route path="/deep/gestao/mockups" element={<MockupsPage />} />
                  <Route path="/deep/gestao/site" element={<SitePage />} />
                  <Route path="/deep/gestao/catalogo" element={<CatalogoSettingsPage />} />
                  <Route path="/deep/gestao/usuarios" element={<UsersPage />} />
                  <Route path="/deep/gestao/empresa" element={<CompanyPage />} />
                  {/* Public Tracking */}
                  <Route path="/rastreio/:trackingCode" element={<TrackingPublic />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </ManagementProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
