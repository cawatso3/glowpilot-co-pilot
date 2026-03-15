import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContentIdeas } from '@/hooks/useContentIdeas';
import { useContentCalendarSettings } from '@/hooks/useContentCalendarSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Sparkles, Video, X, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';
import type { ContentType, ContentPlatform, ContentStatus, ContentIdea } from '@/types/database';

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

const ALL_STATUSES: ContentStatus[] = ['idea', 'planned', 'filming', 'editing', 'scheduled', 'published'];

const SUGGESTED_IDEAS = [
  { title: "Spring Skincare Routine Switch-Up", content_type: "educational" as ContentType, platform: "tiktok" as ContentPlatform, suggested_hook: "If you're still using your winter skincare in spring, we need to talk...", talking_points: ["Lighter moisturizer", "SPF upgrade", "Exfoliation frequency"] },
  { title: "Client Glow-Up Transformation", content_type: "transformation" as ContentType, platform: "instagram" as ContentPlatform, suggested_hook: "4 weeks of consistent treatments and look at this glow ✨", talking_points: ["Before photo", "Treatment plan", "After reveal"] },
  { title: "Day in My Life as an Esthetician", content_type: "behind_the_scenes" as ContentType, platform: "tiktok" as ContentPlatform, suggested_hook: "POV: You spend a day with me at the studio...", talking_points: ["Morning prep", "Client interactions", "Favorite part of the day"] },
  { title: "3 Ingredients Your Skin Needs This Season", content_type: "educational" as ContentType, platform: "all" as ContentPlatform, suggested_hook: "These 3 ingredients are going to change your skin game...", talking_points: ["Niacinamide", "Vitamin C", "Hyaluronic acid"] },
  { title: "Mother's Day Gift Card Special", content_type: "promotional" as ContentType, platform: "all" as ContentPlatform, suggested_hook: "The perfect gift she actually wants this Mother's Day 💝", talking_points: ["Gift card packages", "Limited-time pricing", "How to purchase"] },
];

const emptyForm = {
  title: '',
  description: '',
  content_type: 'educational' as ContentType,
  platform: 'all' as ContentPlatform,
  suggested_hook: '',
  talking_points: [''],
  filming_notes: '',
  scheduled_date: '',
  scheduled_time: '',
};

export default function ContentPlanner() {
  const { user } = useAuth();
  const { ideas, isLoading, createIdea, updateIdea, deleteIdea } = useContentIdeas(user?.id);
  const { settings: calSettings } = useContentCalendarSettings(user?.id);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [newIdea, setNewIdea] = useState({ ...emptyForm });
  const [calendarDaySheet, setCalendarDaySheet] = useState<Date | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredIdeas = ideas
    .filter(i => typeFilter === 'all' || i.content_type === typeFilter)
    .filter(i => platformFilter === 'all' || i.platform === platformFilter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter);

  const filmingList = ideas.filter(i => i.status === 'planned' || i.status === 'filming');

  // Week progress
  const weekIdeas = ideas.filter(i => {
    if (!i.scheduled_date) return false;
    const d = new Date(i.scheduled_date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });
  const postsGoal = calSettings?.posts_per_week_goal ?? 4;
  const weekProgress = Math.min((weekIdeas.length / postsGoal) * 100, 100);

  const openDialog = (idea?: ContentIdea) => {
    if (idea) {
      setEditingIdea(idea);
      setNewIdea({
        title: idea.title,
        description: idea.description || '',
        content_type: idea.content_type,
        platform: idea.platform,
        suggested_hook: idea.suggested_hook || '',
        talking_points: idea.talking_points?.length ? [...idea.talking_points] : [''],
        filming_notes: idea.filming_notes || '',
        scheduled_date: idea.scheduled_date || '',
        scheduled_time: idea.scheduled_time || '',
      });
    } else {
      setEditingIdea(null);
      setNewIdea({ ...emptyForm });
    }
    setDialogOpen(true);
  };

  const openDialogForDate = (date: Date) => {
    setEditingIdea(null);
    setNewIdea({ ...emptyForm, scheduled_date: format(date, 'yyyy-MM-dd') });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newIdea.title) return;
    const talkingPoints = newIdea.talking_points.filter(tp => tp.trim() !== '');
    const payload: any = {
      title: newIdea.title,
      description: newIdea.description || null,
      content_type: newIdea.content_type,
      platform: newIdea.platform,
      suggested_hook: newIdea.suggested_hook || null,
      talking_points: talkingPoints.length > 0 ? talkingPoints : null,
      filming_notes: newIdea.filming_notes || null,
      scheduled_date: newIdea.scheduled_date || null,
      scheduled_time: newIdea.scheduled_time || null,
      status: newIdea.scheduled_date ? 'scheduled' : (editingIdea?.status || 'idea'),
    };

    if (editingIdea) {
      await updateIdea.mutateAsync({ id: editingIdea.id, ...payload });
      toast({ title: 'Idea updated!' });
    } else {
      await createIdea.mutateAsync(payload);
      toast({ title: 'Content idea added!' });
    }
    setNewIdea({ ...emptyForm });
    setEditingIdea(null);
    setDialogOpen(false);
  };

  const handleAddSuggestion = async (idx: number) => {
    const s = SUGGESTED_IDEAS[idx];
    await createIdea.mutateAsync({
      title: s.title,
      content_type: s.content_type,
      platform: s.platform,
      suggested_hook: s.suggested_hook,
      talking_points: s.talking_points,
      is_ai_suggested: true,
    } as any);
    setAddedSuggestions(prev => new Set(prev).add(idx));
    toast({ title: 'Added to your ideas!' });
  };

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    await updateIdea.mutateAsync({ id, status });
    toast({ title: `Status updated to ${status}` });
  };

  const handleDelete = async (id: string) => {
    await deleteIdea.mutateAsync(id);
    setExpandedId(null);
    toast({ title: 'Idea deleted' });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Planner</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setSuggestOpen(true); setAddedSuggestions(new Set()); }}>
            <Sparkles className="h-4 w-4" /> Suggest Ideas
          </Button>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4" /> New Idea
          </Button>
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
          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('all')}>All Types</Button>
            {Object.keys(TYPE_COLORS).map(t => (
              <Button key={t} variant={typeFilter === t ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(t)} className="capitalize whitespace-nowrap">
                {t.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
          {/* Platform filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={platformFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter('all')}>All Platforms</Button>
            {(['tiktok', 'instagram', 'google_business'] as ContentPlatform[]).map(p => (
              <Button key={p} variant={platformFilter === p ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter(p)} className="capitalize whitespace-nowrap">
                {p === 'google_business' ? 'Google Business' : p}
              </Button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All Status</Button>
            {ALL_STATUSES.map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize whitespace-nowrap">
                {s}
              </Button>
            ))}
          </div>

          {filteredIdeas.length === 0 ? (
            <Card className="border-none shadow-low"><CardContent className="p-8 text-center text-muted-foreground">No content ideas yet. Tap "New Idea" to get started! ✨</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIdeas.map((idea) => {
                const isExpanded = expandedId === idea.id;
                return (
                  <Card
                    key={idea.id}
                    className="border-none shadow-low hover:shadow-mid transition-all cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{idea.title}</h3>
                        <Badge className={`${STATUS_COLORS[idea.status]} text-xs`}>{idea.status}</Badge>
                      </div>
                      <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>{idea.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${TYPE_COLORS[idea.content_type as ContentType]} text-xs capitalize border-none`}>
                          {idea.content_type?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{idea.platform}</span>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 pt-2 border-t border-border">
                          {idea.suggested_hook && (
                            <p className="text-xs italic text-muted-foreground">🎣 Hook: "{idea.suggested_hook}"</p>
                          )}
                          {idea.talking_points && idea.talking_points.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">💬 Talking Points:</p>
                              <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
                                {idea.talking_points.map((tp, i) => <li key={i}>{tp}</li>)}
                              </ol>
                            </div>
                          )}
                          {idea.filming_notes && (
                            <p className="text-xs text-muted-foreground">🎥 Notes: {idea.filming_notes}</p>
                          )}
                          {idea.scheduled_date && (
                            <p className="text-xs text-muted-foreground">📅 Scheduled: {format(new Date(idea.scheduled_date), 'MMM d, yyyy')}{idea.scheduled_time ? ` at ${idea.scheduled_time}` : ''}</p>
                          )}
                          <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => openDialog(idea)}>
                              <Pencil className="h-3 w-3" /> Edit
                            </Button>
                            <Select value={idea.status} onValueChange={(v) => handleStatusChange(idea.id, v as ContentStatus)}>
                              <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"><Trash2 className="h-3 w-3" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this content idea?</AlertDialogTitle>
                                  <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(idea.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{weekIdeas.length} of {postsGoal} posts planned this week</span>
              {weekIdeas.length >= postsGoal && <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Goal reached! 🎉</span>}
            </div>
            <Progress value={weekProgress} className="h-2" />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {weekDays.map((day) => {
              const dayIdeas = ideas.filter(i => i.scheduled_date && isSameDay(new Date(i.scheduled_date), day));
              return (
                <div key={day.toISOString()} className="min-w-[10rem] flex-1 space-y-2">
                  <div className="text-sm font-medium text-center">{format(day, 'EEE, MMM d')}</div>
                  {dayIdeas.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => openDialogForDate(day)}
                    >
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
            <CardContent className="p-6">
              <CalendarContent ideas={ideas} onDayClick={(d) => setCalendarDaySheet(d)} />
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

      {/* New/Edit Idea Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingIdea(null); setNewIdea({ ...emptyForm }); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingIdea ? 'Edit Content Idea' : 'New Content Idea'}</DialogTitle></DialogHeader>
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
            <div className="space-y-2">
              <Label>Hook</Label>
              <Input value={newIdea.suggested_hook} onChange={(e) => setNewIdea({ ...newIdea, suggested_hook: e.target.value })} placeholder="The first thing you'll say on camera..." />
            </div>
            <div className="space-y-2">
              <Label>Talking Points</Label>
              {newIdea.talking_points.map((tp, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={tp}
                    onChange={(e) => {
                      const pts = [...newIdea.talking_points];
                      pts[i] = e.target.value;
                      setNewIdea({ ...newIdea, talking_points: pts });
                    }}
                    placeholder={`Point ${i + 1}`}
                  />
                  {newIdea.talking_points.length > 1 && (
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setNewIdea({ ...newIdea, talking_points: newIdea.talking_points.filter((_, j) => j !== i) })}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setNewIdea({ ...newIdea, talking_points: [...newIdea.talking_points, ''] })}>
                <Plus className="h-3 w-3" /> Add point
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Filming Notes</Label>
              <Textarea value={newIdea.filming_notes} onChange={(e) => setNewIdea({ ...newIdea, filming_notes: e.target.value })} placeholder="Setup, lighting, props, outfit notes..." />
            </div>
            <div className="space-y-2">
              <Label>Schedule for (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={newIdea.scheduled_date} onChange={(e) => setNewIdea({ ...newIdea, scheduled_date: e.target.value })} />
                <Input type="time" value={newIdea.scheduled_time} onChange={(e) => setNewIdea({ ...newIdea, scheduled_time: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createIdea.isPending || updateIdea.isPending}>
              {editingIdea ? 'Save Changes' : 'Add Idea'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggest Ideas Dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Ideas for You ✨</DialogTitle>
            <p className="text-sm text-muted-foreground">Based on your content pillars and upcoming seasonal events, here are some ideas. Tap any to add it to your queue.</p>
          </DialogHeader>
          <div className="space-y-3">
            {SUGGESTED_IDEAS.map((s, idx) => (
              <Card key={idx} className="border-none shadow-low">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm">{s.title}</h3>
                    <Badge className={`${TYPE_COLORS[s.content_type]} text-xs capitalize border-none`}>{s.content_type.replace(/_/g, ' ')}</Badge>
                  </div>
                  {s.suggested_hook && <p className="text-xs italic text-muted-foreground">"{s.suggested_hook}"</p>}
                  {addedSuggestions.has(idx) ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="h-3 w-3" /> Added</div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleAddSuggestion(idx)} disabled={createIdea.isPending}>
                      <Plus className="h-3 w-3" /> Add to Ideas
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={() => setSuggestOpen(false)} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>

      {/* Calendar Day Detail Sheet */}
      <Sheet open={!!calendarDaySheet} onOpenChange={() => setCalendarDaySheet(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {calendarDaySheet && (
            <div className="space-y-4 mt-6">
              <SheetHeader>
                <SheetTitle>{format(calendarDaySheet, 'EEEE, MMMM d, yyyy')}</SheetTitle>
              </SheetHeader>
              {(() => {
                const dayIdeas = ideas.filter(i => i.scheduled_date && isSameDay(new Date(i.scheduled_date), calendarDaySheet));
                return dayIdeas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No content scheduled for this day.</p>
                ) : (
                  <div className="space-y-3">
                    {dayIdeas.map(idea => (
                      <Card key={idea.id} className="border-none shadow-low">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-sm">{idea.title}</h3>
                            <Badge className={`${STATUS_COLORS[idea.status]} text-xs`}>{idea.status}</Badge>
                          </div>
                          <Badge className={`${TYPE_COLORS[idea.content_type as ContentType]} text-xs capitalize border-none`}>{idea.content_type?.replace(/_/g, ' ')}</Badge>
                          <Button variant="outline" size="sm" onClick={() => { setCalendarDaySheet(null); openDialog(idea); }}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}
              <Button variant="outline" className="w-full" onClick={() => { openDialogForDate(calendarDaySheet); setCalendarDaySheet(null); }}>
                <Plus className="h-4 w-4" /> Add content for this day
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CalendarContent({ ideas, onDayClick }: { ideas: ContentIdea[]; onDayClick: (d: Date) => void }) {
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
            <div
              key={i}
              className={`p-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-muted/50 ${isSameDay(day, today) ? 'bg-primary/10 font-semibold' : ''}`}
              onClick={() => onDayClick(day)}
            >
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
