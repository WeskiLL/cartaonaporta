import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { ManagementSidebar } from './ManagementSidebar';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ManagementLayoutProps {
  children: ReactNode;
}

export function ManagementLayout({ children }: ManagementLayoutProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <div className="min-h-screen bg-background dark">
        <ManagementSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
        <main className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
          'pt-16 lg:pt-0'
        )}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
