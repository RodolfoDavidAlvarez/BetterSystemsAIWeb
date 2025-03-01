import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userDataStr = localStorage.getItem('user');
      
      if (!token || !userDataStr) {
        setIsAuthenticated(false);
        return;
      }
      
      try {
        // Parse user data from localStorage
        const userData = JSON.parse(userDataStr);
        
        // If role is required and user doesn't have the role, redirect
        if (requiredRole && userData.role !== requiredRole) {
          throw new Error('Insufficient permissions');
        }
        
        // Verify token with the server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }
        
        // Successfully authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth validation error:', error);
        setIsAuthenticated(false);
        
        // Clear invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };
    
    checkAuth();
  }, [navigate, requiredRole, toast]);
  
  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    toast({
      title: 'Authentication required',
      description: 'Please log in to access this page',
      variant: 'destructive',
    });
    navigate('/admin/login');
    return null;
  }
  
  // Authenticated, render children
  return <>{children}</>;
}