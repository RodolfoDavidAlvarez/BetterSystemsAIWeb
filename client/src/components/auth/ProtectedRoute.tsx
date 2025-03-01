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
      // Check both token storage locations for backward compatibility
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userDataStr = localStorage.getItem('user');
      
      if (!token || !userDataStr) {
        console.log('No authentication token or user data found');
        setIsAuthenticated(false);
        return;
      }
      
      try {
        // Parse user data from localStorage
        const userData = JSON.parse(userDataStr);
        
        // If role is required and user doesn't have the role, redirect
        if (requiredRole && userData.role !== requiredRole) {
          console.warn(`User does not have required role: ${requiredRole}`);
          throw new Error(`You need ${requiredRole} permissions to access this page`);
        }
        
        // Verify token with the server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.');
          } else {
            throw new Error(`Authentication failed: ${response.statusText}`);
          }
        }
        
        // Verify the response data
        const data = await response.json();
        if (!data.user || !data.user.id) {
          throw new Error('Invalid user data received from server');
        }
        
        // Update the local user data if needed
        if (data.user.username && data.user.role) {
          const currentUser = {
            id: data.user.id,
            username: data.user.username,
            name: data.user.name || data.user.username,
            role: data.user.role,
            lastVerified: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        // Successfully authenticated
        setIsAuthenticated(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        console.error('Auth validation error:', error);
        setIsAuthenticated(false);
        
        // Clear invalid auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Display a more helpful error message
        toast({
          title: 'Authentication failed',
          description: errorMessage,
          variant: 'destructive',
        });
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