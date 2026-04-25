import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

export default function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userDataStr = localStorage.getItem('user');

      if (!token || !userDataStr) {
        console.log('No authentication token or user data found');
        setIsAuthenticated(false);
        return;
      }

      try {
        const userData = JSON.parse(userDataStr);

        if (allowedRoles.length && !allowedRoles.includes(userData.role)) {
          throw new Error(`You need ${allowedRoles.join(' or ')} permissions to access this page`);
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.');
          } else {
            throw new Error(`Authentication failed: ${response.statusText}`);
          }
        }

        const data = await response.json();
        if (!data.user || !data.user.id) {
          throw new Error('Invalid user data received from server');
        }

        if (data.user.username && data.user.role) {
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            username: data.user.username,
            name: data.user.name || data.user.username,
            email: data.user.email,
            role: data.user.role,
            lastVerified: new Date().toISOString()
          }));
        }

        setIsAuthenticated(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        console.error('Auth validation error:', error);
        setIsAuthenticated(false);

        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        toast({
          title: 'Authentication failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    checkAuth();
  }, [requiredRole, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect when auth fails — this hook must always run (not after an early return)
  useEffect(() => {
    if (isAuthenticated === false) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to access this page',
        variant: 'destructive',
      });
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate, toast]);

  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
