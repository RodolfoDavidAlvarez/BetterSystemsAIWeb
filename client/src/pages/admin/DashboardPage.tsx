import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { LogOut, FileText, FilePlus, Home } from 'lucide-react';

export default function DashboardPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ 
    id: number; 
    username: string; 
    name: string; 
    role: string; 
  } | null>(null);
  
  useEffect(() => {
    // Load user data from localStorage
    const userDataStr = localStorage.getItem('user');
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUserData(userData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    navigate('/admin/login');
  };
  
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {userData?.name || 'Admin'}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Blog Management</CardTitle>
              <CardDescription>
                Manage your blog posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, edit, and manage blog posts. You can also publish or unpublish posts.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={() => navigate('/admin/blog')}>
                <FileText className="mr-2 h-4 w-4" />
                View Posts
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/blog/new')}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </CardFooter>
          </Card>
          
          {/* Additional cards can be added here for other admin features */}
        </div>
      </div>
    </div>
  );
}