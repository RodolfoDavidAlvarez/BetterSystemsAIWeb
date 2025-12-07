import { QueryClient } from "@tanstack/react-query";

// Helper to get the API base URL with better environment handling
export const getApiBaseUrl = () => {
  // Check if VITE_SERVER_URL is set, regardless of environment
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  
  if (serverUrl) {
    console.log(`Using API base URL from env: ${serverUrl}/api`);
    return `${serverUrl}/api`;
  }
  
  // Special handling for Replit environments
  if (window.location.hostname.includes('.repl.co') || 
      window.location.hostname.includes('.replit.dev')) {
    // For Replit deployments, we need to handle port 3000 specially
    const protocol = window.location.protocol;
    
    // Extract the base domain  
    let apiUrl = '';
    
    if (window.location.hostname.includes('worf.replit.dev')) {
      // For the Replit webview, we need to use a different hostname formatting
      const projectId = window.location.hostname.split('-')[0];
      // Use direct hostname access for the server
      apiUrl = `${protocol}//${projectId}-00-30fh2v6ia1lbk.worf.replit.dev:3000/api`;
    } else {
      // Regular Replit domain
      const hostParts = window.location.hostname.split('.');
      const domain = hostParts[0]; 
      apiUrl = `${protocol}//${domain}.${hostParts.slice(1).join('.')}:3000/api`;
    }
    
    console.log(`Using Replit-specific API URL: ${apiUrl}`);
    return apiUrl;
  }
  
  // Use relative URLs in local development to go through Vite proxy (avoids CORS)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`Using relative API URL (will proxy to port 3000)`);
    return '/api';
  }
  
  // For production deployment
  console.log("Using relative API URL");
  return '/api';
};

// Get authentication token with support for multiple storage locations
export const getAuthToken = () => {
  // Try the new location first, then fall back to the old one
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

// The actual logout function is defined after queryClient to avoid circular dependencies

// Enhanced fetch function with better error handling and retry capabilities
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  const isApiCall = url.startsWith('/api');
  
  // Add authorization token to headers if available
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token && isApiCall ? { Authorization: `Bearer ${token}` } : {})
  };
  
  // Track the request for debugging
  const requestStartTime = Date.now();
  console.debug(`API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    
    const requestDuration = Date.now() - requestStartTime;
    console.debug(`API Response: ${options.method || 'GET'} ${url} - ${res.status} (${requestDuration}ms)`);

    if (!res.ok) {
      // Handle specific error codes
      if (res.status === 401 || res.status === 403) {
        // Authentication or authorization error
        console.warn(`Auth error (${res.status}) for ${url}`);
        
        // Clear auth tokens on unauthorized/forbidden
        if (isApiCall && token) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          
          // Only redirect to login for admin pages, not for public facing pages
          if (window.location.pathname.includes('/admin/') && 
              !window.location.pathname.includes('/admin/login')) {
            console.warn('Authentication required, redirecting to login');
            // Use a small timeout to allow other code to finish
            setTimeout(() => {
              window.location.href = '/admin/login';
            }, 100);
          }
        }
      }
      
      // Handle server errors
      if (res.status >= 500) {
        console.error(`Server error: ${res.status} ${res.statusText}`);
        throw new Error(`Server error (${res.status}): ${res.statusText || 'Unknown server error'}`);
      }

      // Handle other client errors
      const errorBody = await res.text();
      let errorMessage = `Error ${res.status}: ${res.statusText || 'Unknown error'}`;
      
      try {
        // Try to parse as JSON
        if (errorBody && errorBody.trim().startsWith('{')) {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        }
      } catch (parseError) {
        // If not JSON, use text
        console.warn('Error parsing error response:', parseError);
        errorMessage = errorBody || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Check if response is empty
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      return res.text();
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Configure React Query Client with enhanced options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        
        // Process the URL to ensure it's properly formatted
        const resolvedUrl = url.startsWith('http') || url.startsWith('/') 
          ? url 
          : `${getApiBaseUrl()}/${url}`;
          
        return enhancedFetch(resolvedUrl);
      },
      refetchInterval: false,
      refetchOnWindowFocus: import.meta.env.PROD, // Only refetch on window focus in production
      staleTime: 60000, // 1 minute
      retry: (failureCount, error) => {
        // Don't retry on auth errors (401/403)
        if (error instanceof Error && 
            (error.message.includes('Error 401') || 
             error.message.includes('Error 403'))) {
          return false;
        }
        
        // Don't retry on other client errors (4xx)
        if (error instanceof Error && error.message.includes('Error 4')) {
          return false;
        }
        
        // Retry network and server errors, but limit to 2 attempts
        return failureCount < 2;
      },
      // Note: Global error handlers would go here in newer versions of React Query
    },
    mutations: {
      // Add retry for mutations on network errors
      retry: (failureCount, error) => {
        // Only retry on network errors, not on API errors
        const isNetworkError = error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('Network request failed') ||
           error.message.includes('network') ||
           error.message.includes('Network'));
        return isNetworkError && failureCount < 2;
      },
      // Note: Global error handlers would go here in newer versions of React Query
    }
  },
});

// Now that queryClient is defined, we can implement and export the logout function
export const logout = (redirectUrl = '/admin/login') => {
  // Clear all auth-related data
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear any session cookies if needed
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  // Clear query cache to ensure no stale data remains
  queryClient.clear();
  
  // Redirect if requested
  if (redirectUrl) {
    window.location.href = redirectUrl;
  }
  
  console.log('User logged out successfully');
};
