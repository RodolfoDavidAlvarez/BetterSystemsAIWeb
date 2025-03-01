import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { CheckCircle, Clock, Edit, Eye, FilePlus, Trash2, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';

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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function BlogPostsPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [publishedFilter, setPublishedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to access the admin dashboard',
        variant: 'destructive',
      });
      navigate('/admin/login');
      return;
    }
    
    fetchPosts();
  }, [navigate, toast, pagination.page, publishedFilter]);
  
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (publishedFilter !== null) {
        queryParams.append('published', publishedFilter);
      }
      
      const response = await fetch(`/api/admin/blog?${queryParams.toString()}`, {
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
        throw new Error('Failed to fetch blog posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch blog posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };
  
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };
  
  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/blog/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }
      
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
      
      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete blog post',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };
  
  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !post.published,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${post.published ? 'unpublish' : 'publish'} blog post`);
      }
      
      toast({
        title: 'Success',
        description: `Blog post ${post.published ? 'unpublished' : 'published'} successfully`,
      });
      
      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update blog post',
        variant: 'destructive',
      });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
            <p className="text-muted-foreground">
              Manage your blog content
            </p>
          </div>
          <div>
            <Button onClick={() => navigate('/admin/blog/new')}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Blog Post Management</CardTitle>
            <CardDescription>
              View, edit, publish, and delete your blog posts
            </CardDescription>
          </CardHeader>
          
          <div className="px-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <Input
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </form>
              
              <div className="w-full sm:w-48">
                <Select
                  value={publishedFilter === null ? '' : publishedFilter}
                  onValueChange={(value) => setPublishedFilter(value === '' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Posts</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No blog posts found</p>
              </div>
            ) : (
              <div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-60" title={post.title}>
                              {post.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.published ? (
                              <Badge variant="default" className="flex items-center w-fit bg-green-500 hover:bg-green-600">
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center w-fit">
                                <Clock className="mr-1 h-3.5 w-3.5" />
                                Draft
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <span title={`Updated: ${formatDate(post.updatedAt)}`}>
                              {formatDate(post.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="View"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Edit"
                                onClick={() => navigate(`/admin/blog/${post.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={post.published ? "destructive" : "default"}
                                size="icon"
                                title={post.published ? "Unpublish" : "Publish"}
                                onClick={() => handleTogglePublish(post)}
                              >
                                {post.published ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Delete"
                                onClick={() => handleDeleteClick(post)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {pagination.pages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {pagination.page > 1 && (
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pagination.page - 1);
                              }}
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter(page => {
                            return (
                              page === 1 ||
                              page === pagination.pages ||
                              (page >= pagination.page - 1 && page <= pagination.page + 1)
                            );
                          })
                          .map((page, index, array) => {
                            const needsEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                            const needsEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                            
                            return (
                              <div key={`pagination-${page}`}>
                                {needsEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    isActive={page === pagination.page}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePageChange(page);
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                                
                                {needsEllipsisAfter && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                              </div>
                            );
                          })}
                        
                        {pagination.page < pagination.pages && (
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pagination.page + 1);
                              }}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the blog post "{postToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}