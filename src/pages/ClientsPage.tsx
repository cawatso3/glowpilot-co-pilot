import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MessageSquare, Calendar, Star, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import type { Client, ClientStatus } from '@/types/database';

const STATUS_STYLES: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-700',
  lapsed: 'bg-amber-100 text-amber-700',
  lost: 'bg-red-100 text-red-700',
  new: 'bg-blue-100 text-blue-700',
};

export default function ClientsPage() {
  const { user } = useAuth();
  const { clients, isLoading, createClient } = useClients(user?.id);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ full_name: '', email: '', phone: '', last_service: '', notes: '', referral_source: '' });

  const filtered = clients
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.full_name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newClient.full_name) return;
    await createClient.mutateAsync(newClient as any);
    setNewClient({ full_name: '', email: '', phone: '', last_service: '', notes: '', referral_source: '' });
    setDialogOpen(false);
    toast({ title: 'Client added!' });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} placeholder="Client name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Last Service</Label><Input value={newClient.last_service} onChange={(e) => setNewClient({ ...newClient, last_service: e.target.value })} /></div>
              <div className="space-y-2"><Label>Referral Source</Label><Input value={newClient.referral_source} onChange={(e) => setNewClient({ ...newClient, referral_source: e.target.value })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createClient.isPending}>Add Client</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-9" />
        </div>
      </div>
      <div className="flex gap-2">
        {['all', 'active', 'lapsed', 'lost', 'new'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
            {s === 'all' ? 'All' : s}
          </Button>
        ))}
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <Card className="border-none shadow-low"><CardContent className="p-8 text-center text-muted-foreground">No clients found. Add your first client to get started!</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <Card key={client.id} className="border-none shadow-low hover:shadow-mid transition-all cursor-pointer" onClick={() => setSelectedClient(client)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {client.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.full_name}</p>
                    <p className="text-xs text-muted-foreground">{client.last_service || 'No services yet'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{client.last_visit_date ? format(new Date(client.last_visit_date), 'MMM d') : '—'}</p>
                    <p className="text-xs font-medium tabular-nums">${Number(client.lifetime_value).toFixed(0)}</p>
                  </div>
                  <Badge className={`${STATUS_STYLES[client.status as ClientStatus]} text-xs capitalize border-none`}>{client.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Client Detail Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedClient && (
            <div className="space-y-6 mt-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                    {selectedClient.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <SheetTitle>{selectedClient.full_name}</SheetTitle>
                    <Badge className={`${STATUS_STYLES[selectedClient.status as ClientStatus]} text-xs capitalize border-none mt-1`}>{selectedClient.status}</Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                <Card className="border-none shadow-low"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Visits</p><p className="text-lg font-semibold tabular-nums">{selectedClient.visit_count}</p></CardContent></Card>
                <Card className="border-none shadow-low"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Lifetime Value</p><p className="text-lg font-semibold tabular-nums">${Number(selectedClient.lifetime_value).toFixed(0)}</p></CardContent></Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Coming soon', description: 'Messaging will be connected in the next update.' })}><MessageSquare className="h-4 w-4" /> Message</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Coming soon' })}><Calendar className="h-4 w-4" /> Book</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Coming soon' })}><Star className="h-4 w-4" /> Review</Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Contact</h3>
                <p className="text-sm text-muted-foreground">{selectedClient.email || '—'}</p>
                <p className="text-sm text-muted-foreground">{selectedClient.phone || '—'}</p>
              </div>

              {selectedClient.tags && selectedClient.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedClient.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
                </div>
              )}

              {selectedClient.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
