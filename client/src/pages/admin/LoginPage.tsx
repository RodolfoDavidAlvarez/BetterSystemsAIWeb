import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useScrollToTop } from '../../hooks/useScrollToTop';

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        // Parse the user data to check role
        const userData = JSON.parse(user);
        if (userData && userData.role === 'admin') {
          // User is already logged in, redirect to dashboard
          navigate('/admin/dashboard');
        }
      } catch (error) {
        // If there's an error, clear the invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);
  
  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Sending login request with credentials:', {
        username: values.username,
        passwordLength: values.password.length
      });
      
      // Determine the API URL based on environment and host
      let baseUrl = '/api';
      
      if (import.meta.env.VITE_SERVER_URL) {
        baseUrl = `${import.meta.env.VITE_SERVER_URL}/api`;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://0.0.0.0:3000/api';
      }
      
      console.log(`Using API base URL: ${baseUrl}`);
      
      // Make the login request
      try {
        console.log(`Attempting to connect to ${baseUrl}/auth/login`);
        const response = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
          credentials: 'include', // Include cookies for cross-origin requests
        });
        
        console.log('Login response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries([...response.headers.entries()]),
        });
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        console.log('Login response parsed JSON data:', {
          success: data.success,
          message: data.message,
          hasToken: !!data.token,
          tokenLength: data.token ? data.token.length : 0,
          userData: data.user ? {id: data.user.id, username: data.user.username, role: data.user.role} : null,
        });
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
      } catch (fetchError) {
        console.error('Fetch error during login:', fetchError);
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('NetworkError') || 
              fetchError.message.includes('Failed to fetch') || 
              fetchError.message.includes('Network request failed')) {
            throw new Error(`Network error: Cannot connect to server at ${baseUrl}. Please check your connection and try again.`);
          }
          throw fetchError;
        }
        throw new Error('Unknown error during login request');
      }
      
      if (!data.token) {
        throw new Error('No authentication token received');
      }
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        name: data.user.name || data.user.username,
        role: data.user.role,
        lastLogin: new Date().toISOString()
      }));
      
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      
      // Wait a short time to ensure toasts are visible
      setTimeout(() => {
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      }, 500);
    } catch (error) {
      let errorMessage = 'Something went wrong during login';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Special case for JSON parse errors
        if (error.message.includes('JSON')) {
          errorMessage = 'Unable to process server response. Please try again.';
        }
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}