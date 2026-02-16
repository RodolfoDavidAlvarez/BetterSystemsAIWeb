import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Star, Trash2, RefreshCw } from "lucide-react";

interface Review {
  id: number;
  clientId: number | null;
  projectId: number | null;
  phase: string | null;
  reviewerName: string;
  reviewerEmail: string;
  companyName: string | null;
  rating: number;
  comment: string;
  status: "new" | "approved" | "hidden";
  isPublic: boolean;
  submittedAt: string;
  clientName?: string | null;
  projectName?: string | null;
}

interface ReviewStats {
  total: number;
  averageRating: number;
  approved: number;
  new: number;
}

const statusBadge: Record<Review["status"], string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hidden: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ReviewsPage() {
  useScrollToTop();
  const { toast } = useToast();
  const baseUrl = getApiBaseUrl();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    averageRating: 0,
    approved: 0,
    new: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [savingReviewId, setSavingReviewId] = useState<number | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/reviews`, { headers: getAuthHeaders() }),
        fetch(`${baseUrl}/admin/reviews/stats`, { headers: getAuthHeaders() }),
      ]);
      const reviewsData = await reviewsRes.json();
      const statsData = await statsRes.json();

      if (reviewsData.success) setReviews(reviewsData.reviews || []);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        review.reviewerName.toLowerCase().includes(q) ||
        review.reviewerEmail.toLowerCase().includes(q) ||
        (review.companyName || "").toLowerCase().includes(q) ||
        (review.comment || "").toLowerCase().includes(q) ||
        (review.projectName || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [reviews, search, statusFilter]);

  const updateReview = async (id: number, payload: Partial<Review>) => {
    setSavingReviewId(id);
    try {
      const response = await fetch(`${baseUrl}/admin/reviews/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update review");
      }
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
      toast({ title: "Saved", description: "Review updated" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update review",
        variant: "destructive",
      });
    } finally {
      setSavingReviewId(null);
    }
  };

  const deleteReview = async (id: number) => {
    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;
    try {
      const response = await fetch(`${baseUrl}/admin/reviews/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete review");
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Review removed" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Manage client feedback from completed project phases.</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
            <CardTitle>{stats.averageRating.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle>{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New</CardDescription>
            <CardTitle>{stats.new}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, company, project, or comment..."
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading reviews...</CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No reviews found.</CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{review.reviewerName}</CardTitle>
                    <CardDescription>{review.reviewerEmail}</CardDescription>
                    <CardDescription>
                      {[review.companyName, review.projectName, review.phase].filter(Boolean).join(" • ")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statusBadge[review.status]}>
                      {review.status}
                    </Badge>
                    <Badge variant={review.isPublic ? "default" : "secondary"}>
                      {review.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-5 w-5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Comment</Label>
                  <Textarea
                    value={review.comment}
                    onChange={(e) =>
                      setReviews((prev) =>
                        prev.map((r) => (r.id === review.id ? { ...r, comment: e.target.value } : r))
                      )
                    }
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={review.status}
                      onValueChange={(value: Review["status"]) =>
                        setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: value } : r)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Select
                      value={String(review.rating)}
                      onValueChange={(value) =>
                        setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, rating: Number(value) } : r)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant={review.isPublic ? "default" : "outline"}
                      className="w-full"
                      onClick={() =>
                        setReviews((prev) =>
                          prev.map((r) => (r.id === review.id ? { ...r, isPublic: !r.isPublic } : r))
                        )
                      }
                    >
                      {review.isPublic ? "Set Private" : "Set Public"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(review.submittedAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        updateReview(review.id, {
                          status: review.status,
                          isPublic: review.isPublic,
                          rating: review.rating,
                          comment: review.comment,
                        })
                      }
                      disabled={savingReviewId === review.id}
                    >
                      Save
                    </Button>
                    <Button variant="destructive" onClick={() => deleteReview(review.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
