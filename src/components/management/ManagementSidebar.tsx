import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ArrowLeft,
  Sun,
  Moon,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { path: '/admin/gestao', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/gestao/pedidos', label: 'Pedidos e Orçamentos', icon: FileText },
  { path: '/admin/gestao/rastreio', label: 'Rastreio de Pedidos', icon: Truck },
  { path: '/admin/gestao/clientes', label: 'Clientes', icon: Users },
  { path: '/admin/gestao/produtos', label: 'Produtos', icon: Package },
  { path: '/admin/gestao/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/admin/gestao/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/admin/gestao/mockups', label: 'Mockups', icon: Image },
  { path: '/admin/gestao/usuarios', label: 'Usuários', icon: Users },
  { path: '/admin/gestao/empresa', label: 'Minha Empresa', icon: Building2 },
];

interface ManagementSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ManagementSidebar({ isCollapsed, onToggle }: ManagementSidebarProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
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

            {/* Back to Admin */}
            <NavLink
              to="/admin/dashboard"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Voltar ao Admin</span>}
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
