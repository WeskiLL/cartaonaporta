import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Image,
  Building2,
  ChevronLeft,
  Menu,
  X,
  Sun,
  Moon,
  Truck,
  Globe,
  BookOpen,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const menuItems = [
  { path: '/deep/gestao', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/deep/gestao/pedidos', label: 'Pedidos e Orçamentos', icon: FileText },
  { path: '/deep/gestao/rastreio', label: 'Rastreio de Pedidos', icon: Truck },
  { path: '/deep/gestao/clientes', label: 'Clientes', icon: Users },
  { path: '/deep/gestao/produtos', label: 'Produtos', icon: Package },
  { path: '/deep/gestao/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/deep/gestao/negocios', label: 'Negócios', icon: BarChart3 },
  { path: '/deep/gestao/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/deep/gestao/mockups', label: 'Mockups', icon: Image },
  { path: '/deep/gestao/site', label: 'Gerenciar Site', icon: Globe },
  { path: '/deep/gestao/catalogo', label: 'Catálogo', icon: BookOpen },
  { path: '/deep/gestao/usuarios', label: 'Usuários', icon: Users },
  { path: '/deep/gestao/empresa', label: 'Minha Empresa', icon: Building2 },
];

interface ManagementSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ManagementSidebar({ isCollapsed, onToggle }: ManagementSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Get display name from email
  const getUserDisplayName = () => {
    if (!user?.email) return '';
    const emailParts = user.email.split('@');
    const namePart = emailParts[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return namePart
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/deep');
  };

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden bg-card border border-border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-card border-r border-border',
          isCollapsed ? 'w-[72px]' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h2 className="font-display font-bold text-foreground">Sistema de Gestão</h2>
                  <p className="text-xs text-muted-foreground">Prime Print</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hidden lg:flex"
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform",
                  isCollapsed && "rotate-180"
                )} />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.end 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            {/* User Info */}
            {user && (
              <div className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 mb-2',
                isCollapsed && 'justify-center px-0'
              )}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              onClick={toggleTheme}
              className={cn(
                'w-full justify-start',
                isCollapsed && 'justify-center'
              )}
            >
              {isDark ? (
                <>
                  <Sun className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="ml-3 text-sm font-medium">Modo Claro</span>}
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="ml-3 text-sm font-medium">Modo Escuro</span>}
                </>
              )}
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              onClick={handleLogout}
              className={cn(
                'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="ml-3 text-sm font-medium">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
