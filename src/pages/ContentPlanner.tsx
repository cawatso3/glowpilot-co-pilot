import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContentIdeas } from '@/hooks/useContentIdeas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles, Video, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import type { ContentType, ContentPlatform, ContentStatus } from '@/types/database';

const TYPE_COLORS: Record<ContentType, string> = {
  educational: 'bg-blue-100 text-blue-700',
  transformation: 'bg-purple-100 text-purple-700',
  behind_the_scenes: 'bg-amber-100 text-amber-700',
  testimonial: 'bg-green-100 text-green-700',
  promotional: 'bg-red-100 text-red-700',
  trending: 'bg-pink-100 text-pink-700',
  personal: 'bg-cyan-100 text-cyan-700',
};

const STATUS_COLORS: Record<ContentStatus, string> = {
  idea: 'bg-muted text-muted-foreground',
  planned: 'bg-blue-100 text-blue-700',
  filming: 'bg-amber-100 text-amber-700',
  editing: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-primary/10 text-primary',
  published: 'bg-green-100 text-green-700',
};

export default function ContentPlanner() {
  const { user } = useAuth();
  const { ideas, isLoading, createIdea, updateIdea, deleteIdea } = useContentIdeas(user?.id);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [newIdea, setNewIdea] = useState({ title: '', description: '', content_type: 'educational' as ContentType, platform: 'all' as ContentPlatform });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredIdeas = filter === 'all' ? ideas : ideas.filter(i => i.content_type === filter);
  const filmingList = ideas.filter(i => i.status === 'planned' || i.status === 'filming');

  const handleCreate = async () => {
    if (!newIdea.title) return;
    await createIdea.mutateAsync(newIdea as any);
    setNewIdea({ title: '', description: '', content_type: 'educational', platform: 'all' });
    setDialogOpen(false);
    toast({ title: 'Content idea added!' });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Planner</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'AI-powered content suggestions will be available in the next update.' })}>
            <Sparkles className="h-4 w-4" /> Suggest Ideas
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> New Idea</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Content Idea</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} placeholder="Content idea title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newIdea.description} onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })} placeholder="What's this about?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newIdea.content_type} onValueChange={(v) => setNewIdea({ ...newIdea, content_type: v as ContentType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={newIdea.platform} onValueChange={(v) => setNewIdea({ ...newIdea, platform: v as ContentPlatform })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="google_business">Google Business</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createIdea.isPending}>Add Idea</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="ideas">
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="shotlist">Shot List</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
            {Object.keys(TYPE_COLORS).map(t => (
              <Button key={t} variant={filter === t ? 'default' : 'outline'} size="sm" onClick={() => setFilter(t)} className="capitalize whitespace-nowrap">
                {t.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
          {filteredIdeas.length === 0 ? (
            <Card className="border-none shadow-low"><CardContent className="p-8 text-center text-muted-foreground">No content ideas yet. Tap "New Idea" to get started! ✨</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIdeas.map((idea) => (
                <Card key={idea.id} className="border-none shadow-low hover:shadow-mid transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{idea.title}</h3>
                      <Badge className={`${STATUS_COLORS[idea.status]} text-xs`}>{idea.status}</Badge>
                    </div>
                    {idea.description && <p className="text-xs text-muted-foreground line-clamp-2">{idea.description}</p>}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${TYPE_COLORS[idea.content_type as ContentType]} text-xs capitalize border-none`}>
                        {idea.content_type?.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{idea.platform}</span>
                    </div>
                    {idea.suggested_hook && <p className="text-xs italic text-muted-foreground">"{idea.suggested_hook}"</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4 space-y-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {weekDays.map((day) => {
              const dayIdeas = ideas.filter(i => i.scheduled_date && isSameDay(new Date(i.scheduled_date), day));
              return (
                <div key={day.toISOString()} className="min-w-[10rem] flex-1 space-y-2">
                  <div className="text-sm font-medium text-center">{format(day, 'EEE, MMM d')}</div>
                  {dayIdeas.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
                      <Plus className="h-4 w-4 mx-auto mb-1" /> Add content
                    </div>
                  ) : (
                    dayIdeas.map(idea => (
                      <Card key={idea.id} className="border-none shadow-low">
                        <CardContent className="p-3">
                          <p className="text-xs font-medium">{idea.title}</p>
                          <Badge className={`${TYPE_COLORS[idea.content_type as ContentType]} text-xs mt-1 capitalize border-none`}>
                            {idea.content_type?.replace(/_/g, ' ')}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card className="border-none shadow-low">
            <CardContent className="p-6 text-center text-muted-foreground">
              <CalendarContent ideas={ideas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shotlist" className="mt-4 space-y-4">
          {filmingList.length === 0 ? (
            <Card className="border-none shadow-low"><CardContent className="p-8 text-center text-muted-foreground">No content ready for filming. Move ideas to "Planned" status first.</CardContent></Card>
          ) : (
            <>
              <Button variant="accent" size="sm"><Video className="h-4 w-4" /> Start Filming Day</Button>
              {filmingList.map(idea => (
                <Card key={idea.id} className="border-none shadow-low">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{idea.title}</h3>
                      <Badge className={`${STATUS_COLORS[idea.status]} text-xs`}>{idea.status}</Badge>
                    </div>
                    {idea.suggested_hook && <p className="text-sm"><span className="font-medium">Hook:</span> {idea.suggested_hook}</p>}
                    {idea.talking_points && idea.talking_points.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Talking Points:</span>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {idea.talking_points.map((tp, i) => <li key={i}>{tp}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CalendarContent({ ideas }: { ideas: any[] }) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = monthStart.getDay();

  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">{format(today, 'MMMM yyyy')}</h3>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs text-muted-foreground font-medium p-2">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(today.getFullYear(), today.getMonth(), i + 1);
          const dayIdeas = ideas.filter(idea => idea.scheduled_date && isSameDay(new Date(idea.scheduled_date), day));
          return (
            <div key={i} className={`p-2 rounded-lg text-sm ${isSameDay(day, today) ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/50'}`}>
              {i + 1}
              {dayIdeas.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {dayIdeas.map((_, j) => <div key={j} className="h-1 w-1 rounded-full bg-primary" />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
