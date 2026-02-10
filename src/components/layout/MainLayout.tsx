import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { AIChatbox } from '@/components/chat/AIChatbox';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Sync collapse state with screen size on mount
    const isMobile = window.innerWidth < 1024;
    setSidebarCollapsed(isMobile);

    const handleToggle = () => setSidebarCollapsed(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative flex overflow-x-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={cn(
          'flex-1 min-h-screen transition-all duration-300 w-full min-w-0',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <Outlet />
      </main>

      {/* AI Chatbox */}
      <AIChatbox />
    </div>
  );
};
