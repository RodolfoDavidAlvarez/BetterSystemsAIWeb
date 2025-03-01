import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Calendar, Clock, Tag, User } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  authorId: number;
  authorName: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
}

export default function BlogPostPage() {
  useScrollToTop();
  const { slug } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchPost();
  }, [slug]);
  
  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/blog/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          navigate('/blog');
          throw new Error('Blog post not found');
        }
        throw new Error('Failed to fetch blog post');
      }
      
      const data = await response.json();
      if (!data.success || !data.post) {
        throw new Error('Invalid response from server');
      }
      
      setPost(data.post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load blog post',
        variant: 'destructive',
      });
      navigate('/blog');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="container flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container py-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Blog Post Not Found</h1>
          <p className="text-muted-foreground">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="default" onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div>
          <Button 
            variant="outline" 
            className="mb-6" 
            onClick={() => navigate('/blog')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
          
          {post.coverImage && (
            <div className="aspect-video mb-6 overflow-hidden rounded-lg">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{post.category}</Badge>
              {post.tags && post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.updatedAt !== post.createdAt && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* Display post content */}
              {post.content.split('\n').map((paragraph, index) => (
                paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {post.tags && post.tags.length > 0 ? (
                post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No tags</span>
              )}
            </div>
          </div>
          
          <Button variant="outline" onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    </div>
  );
}