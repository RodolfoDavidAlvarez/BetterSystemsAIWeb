import { QueryClient } from "@tanstack/react-query";

// Helper to get the API base URL with better environment handling
export const getApiBaseUrl = () => {
  // Check if we're in development or production
  console.log("Fetching blog posts with relative URL");
  
  // Always use relative URLs for API requests (working with proxy setup)
  return '/api';
};

// Enhanced fetch function with better error handling and retry capabilities
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  const isApiCall = url.startsWith('/api');
  
  // Add authorization token to headers if available
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    ...(token && isApiCall ? { Authorization: `Bearer ${token}` } : {})
  };
  
  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      // Handle specific error codes
      if (res.status === 401) {
        // Clear auth token on unauthorized
        if (isApiCall && token) {
          localStorage.removeItem('authToken');
          // Optionally redirect to login
          if (window.location.pathname.includes('/admin/')) {
            window.location.href = '/admin/login';
          }
        }
      }
      
      // Handle server errors
      if (res.status >= 500) {
        console.error(`Server error: ${res.status} ${res.statusText}`);
        throw new Error(`Server error (${res.status}): ${res.statusText}`);
      }

      // Handle other client errors
      const errorBody = await res.text();
      let errorMessage = `Error ${res.status}: ${res.statusText}`;
      
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If not JSON, use text
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
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute (reduced from Infinity for better UX)
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors
        if (error instanceof Error && error.message.includes('Error 4')) {
          return false;
        }
        return failureCount < 2; // Retry twice for other errors
      },
    },
    mutations: {
      // Add retry for mutations on network errors
      retry: (failureCount, error) => {
        // Only retry on network errors, not on API errors
        const isNetworkError = error instanceof Error && 
          (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'));
        return isNetworkError && failureCount < 2;
      },
    }
  },
});
