import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { X, Save, ArrowLeft, Loader2, Eye, PenLine } from 'lucide-react';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Form validation schema
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().min(1, 'Excerpt is required').max(300, 'Excerpt must be less than 300 characters'),
  coverImage: z.string().nullable().optional(),
  published: z.boolean().default(false),
  tags: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export default function BlogPostEditor() {
  useScrollToTop();
  const params = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isNew, setIsNew] = useState(true);
  
  // Initialize form
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      coverImage: '',
      published: false,
      tags: '',
      category: '',
    },
  });
  
  // Check if editing existing post or creating new one
  useEffect(() => {
    // Authentication is now handled by ProtectedRoute component
    const postId = params.id;
    if (postId && postId !== 'new') {
      setIsNew(false);
      fetchBlogPost(postId);
    }
  }, [params.id]);
  
  // Fetch existing blog post
  const fetchBlogPost = async (postId: string) => {
    setIsFetching(true);
    try {
      // Authentication is now handled by ProtectedRoute component
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/blog/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/admin/login');
          throw new Error('Authentication error');
        }
        throw new Error('Failed to fetch blog post');
      }
      
      const data = await response.json();
      if (!data.success || !data.post) {
        throw new Error('Invalid response from server');
      }
      
      const post = data.post;
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.coverImage || '',
        published: post.published,
        tags: post.tags ? post.tags.join(', ') : '',
        category: post.category,
      });
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch blog post',
        variant: 'destructive',
      });
      navigate('/admin/blog');
    } finally {
      setIsFetching(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: BlogPostFormValues) => {
    setIsLoading(true);
    try {
      // Authentication is now handled by ProtectedRoute component
      const token = localStorage.getItem('token');
      
      // Process tags
      const tagsArray = values.tags ? 
        values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : 
        [];
      
      // Prepare data for API
      const postData = {
        ...values,
        tags: tagsArray,
      };
      
      let response;
      if (isNew) {
        // Create new post
        response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      } else {
        // Update existing post
        response = await fetch(`/api/admin/blog/${params.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save blog post');
      }
      
      await response.json(); // Process response but we don't need the data
      
      toast({
        title: 'Success',
        description: isNew ? 'Blog post created successfully' : 'Blog post updated successfully',
      });
      
      // Redirect to blog posts list
      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save blog post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate slug from title
  const generateSlug = () => {
    const title = form.getValues('title');
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();
      
      form.setValue('slug', slug, { shouldValidate: true });
    }
  };
  
  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      
      if (value) {
        const currentTags = form.getValues('tags') || '';
        const tagsArray = currentTags.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!tagsArray.includes(value)) {
          tagsArray.push(value);
          form.setValue('tags', tagsArray.join(', '), { shouldValidate: true });
        }
        
        input.value = '';
      }
    }
  };
  
  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || '';
    const tagsArray = currentTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const updatedTags = tagsArray.filter(tag => tag !== tagToRemove);
    form.setValue('tags', updatedTags.join(', '), { shouldValidate: true });
  };
  
  // Render tags
  const renderTags = () => {
    const tags = form.getValues('tags') || '';
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (tagsArray.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {tagsArray.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-muted p-1"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
      </div>
    );
  };
  
  if (isFetching) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/blog')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Create New Blog Post' : 'Edit Blog Post'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/blog')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Post
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Create New Blog Post' : 'Edit Blog Post'}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Post title"
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            if (isNew) {
                              // Only auto-generate slug for new posts
                              generateSlug();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Slug</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateSlug}
                          className="h-7 text-xs"
                          disabled={isLoading}
                        >
                          Generate from Title
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="post-slug"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be used in the URL (e.g., /blog/post-slug)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the post (shown in listings)"
                        className="resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Max 300 characters. This will be displayed in blog listings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Content</FormLabel>
                    <Tabs defaultValue="write">
                      <TabsList className="mb-2">
                        <TabsTrigger value="write" className="flex items-center gap-1">
                          <PenLine className="h-4 w-4" />
                          Write
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="write">
                        <FormControl>
                          <Textarea
                            placeholder="Content supports markdown formatting..."
                            className="min-h-[300px]"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </TabsContent>
                      <TabsContent value="preview" className="border rounded-md p-4 min-h-[300px]">
                        {field.value ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({ src, alt, ...props }) => (
                                  <div className="my-3 flex justify-center">
                                    <img 
                                      src={src} 
                                      alt={alt || 'Blog image'} 
                                      className="rounded-md max-w-full h-auto shadow-sm object-cover" 
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/800x400/1f2937/ffffff?text=Better+Systems+AI';
                                        e.currentTarget.alt = 'Image placeholder';
                                      }}
                                      {...props} 
                                    />
                                  </div>
                                ),
                                code: ({ className, children, ...props }) => {
                                  // Check if this code is inside a pre block (part of a code block)
                                  const isInlineCode = className === undefined;
                                  return isInlineCode ? (
                                    <code className="bg-muted px-1 py-0.5 rounded text-xs my-0" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre: (props) => (
                                  <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs my-3" {...props} />
                                ),
                              }}
                            >
                              {field.value}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-12">
                            <p>No content to preview</p>
                            <p className="text-sm">Add some content in the Write tab to see a preview</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                    <FormDescription>
                      Content supports markdown formatting including headings, links, images, code blocks, and more.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          value={field.value || ''}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no cover image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Category"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add tags (press Enter or comma to add)"
                        onKeyDown={handleTagInput}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter tags separated by commas or press Enter after each tag
                    </FormDescription>
                    {renderTags()}
                    <input
                      type="hidden"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Publish this post
                      </FormLabel>
                      <FormDescription>
                        When enabled, this post will be visible to the public
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/blog')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Post
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}