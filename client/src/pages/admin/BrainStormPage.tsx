import { useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

interface BrainStormIdea {
  id: string;
  title: string;
  details: string;
  createdAt: string;
}

const STORAGE_KEY = "admin:brainstorm:ideas";

export default function BrainStormPage() {
  useScrollToTop();

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDetails, setIdeaDetails] = useState("");
  const [ideas, setIdeas] = useState<BrainStormIdea[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as BrainStormIdea[];
    } catch {
      return [];
    }
  });

  const saveIdeas = (nextIdeas: BrainStormIdea[]) => {
    setIdeas(nextIdeas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIdeas));
  };

  const addIdea = () => {
    if (!ideaTitle.trim() && !ideaDetails.trim()) return;

    const nextIdea: BrainStormIdea = {
      id: crypto.randomUUID(),
      title: ideaTitle.trim() || "Untitled Idea",
      details: ideaDetails.trim(),
      createdAt: new Date().toISOString(),
    };

    saveIdeas([nextIdea, ...ideas]);
    setIdeaTitle("");
    setIdeaDetails("");
  };

  const deleteIdea = (id: string) => {
    saveIdeas(ideas.filter((idea) => idea.id !== id));
  };

  const clearAll = () => {
    saveIdeas([]);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Brain Storm</h1>
        <p className="text-muted-foreground">Capture and organize ideas for Better Systems AI.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr] items-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Add Idea</CardTitle>
            <CardDescription>Drop quick thoughts, strategies, or product concepts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Idea title"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
            />
            <Textarea
              placeholder="Details, notes, or next steps"
              rows={4}
              value={ideaDetails}
              onChange={(e) => setIdeaDetails(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <Button onClick={addIdea}>Save Idea</Button>
              <Button variant="outline" onClick={() => { setIdeaTitle(""); setIdeaDetails(""); }}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Ideas ({ideas.length})</CardTitle>
              <CardDescription>Newest ideas appear first.</CardDescription>
            </div>
            {ideas.length > 0 && (
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {ideas.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                <Lightbulb className="mx-auto h-8 w-8 mb-3 opacity-70" />
                No ideas yet. Add your first brainstorming note above.
              </div>
            )}

            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{idea.title}</h3>
                    {idea.details && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.details}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(idea.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteIdea(idea.id)} aria-label="Delete idea">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
