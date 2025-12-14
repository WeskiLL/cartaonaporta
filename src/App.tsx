import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ManagementProvider } from "@/contexts/ManagementContext";
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ManagementDashboard from "./pages/management/ManagementDashboard";
import ClientsPage from "./pages/management/ClientsPage";
import OrdersPage from "./pages/management/OrdersPage";
import FinancialPage from "./pages/management/FinancialPage";
import ProductsPage from "./pages/management/ProductsPage";
import MockupsPage from "./pages/management/MockupsPage";
import CompanyPage from "./pages/management/CompanyPage";
import ReportsPage from "./pages/management/ReportsPage";
import UsersPage from "./pages/management/UsersPage";
import TrackingPage from "./pages/management/TrackingPage";
import TrackingPublic from "./pages/TrackingPublic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  {/* Management Routes */}
                  <Route path="/admin/gestao" element={<ManagementDashboard />} />
                  <Route path="/admin/gestao/clientes" element={<ClientsPage />} />
                  <Route path="/admin/gestao/pedidos" element={<OrdersPage />} />
                  <Route path="/admin/gestao/rastreio" element={<TrackingPage />} />
                  <Route path="/admin/gestao/financeiro" element={<FinancialPage />} />
                  <Route path="/admin/gestao/produtos" element={<ProductsPage />} />
                  <Route path="/admin/gestao/relatorios" element={<ReportsPage />} />
                  <Route path="/admin/gestao/mockups" element={<MockupsPage />} />
                  <Route path="/admin/gestao/usuarios" element={<UsersPage />} />
                  <Route path="/admin/gestao/empresa" element={<CompanyPage />} />
                  {/* Public Tracking */}
                  <Route path="/rastreio/:id" element={<TrackingPublic />} />
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
