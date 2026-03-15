import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarGaps } from '@/hooks/useCalendarGaps';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Zap, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

export default function CalendarPage() {
  const { user } = useAuth();
  const { appointments, isLoading, createAppointment } = useAppointments(user?.id);
  const { gaps } = useCalendarGaps(user?.id);
  const { clients } = useClients(user?.id);
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({
    client_id: '', service_name: '', appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00', end_time: '11:00', service_price: '',
  });

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const openGaps = gaps.filter(g => g.status === 'open');

  const openDialogForSlot = (day: Date, hour: number) => {
    const h = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');
    setNewAppt({
      client_id: '', service_name: '',
      appointment_date: format(day, 'yyyy-MM-dd'),
      start_time: `${h}:00`, end_time: `${endHour}:00`, service_price: '',
    });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    await createAppointment.mutateAsync({
      client_id: newAppt.client_id || null,
      service_name: newAppt.service_name,
      appointment_date: newAppt.appointment_date,
      start_time: newAppt.start_time,
      end_time: newAppt.end_time,
      service_price: newAppt.service_price ? parseFloat(newAppt.service_price) : null,
    } as any);
    setDialogOpen(false);
    toast({ title: 'Appointment added!' });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar & Gaps</h1>
        <Button size="sm" onClick={() => { setNewAppt({ client_id: '', service_name: '', appointment_date: format(new Date(), 'yyyy-MM-dd'), start_time: '10:00', end_time: '11:00', service_price: '' }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Appointment
        </Button>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1"><span className="font-semibold">{openGaps.length}</span> gaps detected</div>
        <div className="flex items-center gap-1"><span className="font-semibold">{gaps.filter(g => g.status === 'filled').length}</span> filled</div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium">{format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d, yyyy')}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
            <div className="bg-card p-2" />
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`bg-card p-2 text-center text-xs font-medium ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                {format(day, 'EEE d')}
              </div>
            ))}

            {HOURS.map(hour => (
              <>
                <div key={`label-${hour}`} className="bg-card p-2 text-xs text-muted-foreground text-right pr-3">
                  {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
                </div>
                {weekDays.map(day => {
                  const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                  const appt = appointments.find(a =>
                    isSameDay(new Date(a.appointment_date), day) &&
                    a.start_time <= hourStr && a.end_time > hourStr
                  );
                  const gap = gaps.find(g =>
                    isSameDay(new Date(g.gap_date), day) &&
                    g.gap_start_time <= hourStr && g.gap_end_time > hourStr &&
                    g.status === 'open'
                  );
                  const isEmpty = !appt && !gap;

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={`bg-card p-1 min-h-[3rem] relative ${isEmpty ? 'hover:bg-primary/5 cursor-pointer transition-colors' : ''}`}
                      onClick={() => { if (isEmpty) openDialogForSlot(day, hour); }}
                    >
                      {appt && appt.start_time === hourStr && (
                        <div className="absolute inset-1 rounded-md bg-primary/10 border border-primary/20 p-1">
                          <p className="text-xs font-medium truncate">{appt.service_name}</p>
                          <p className="text-xs text-muted-foreground">{appt.start_time.slice(0,5)}</p>
                        </div>
                      )}
                      {gap && gap.gap_start_time === hourStr && (
                        <div className="absolute inset-1 rounded-md border-2 border-dashed border-accent/40 bg-accent/5 p-1 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="text-xs text-accent font-medium">Gap</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {openGaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Gap Alerts</h2>
          {openGaps.map(gap => (
            <Card key={gap.id} className="border-none shadow-low">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(gap.gap_date), 'EEE, MMM d')}</p>
                    <p className="text-xs text-muted-foreground">{gap.gap_start_time.slice(0,5)} — {gap.gap_end_time.slice(0,5)} ({gap.duration_minutes}min)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="accent" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Campaign sending will be connected in the next update.' })}>
                    Send Campaign
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Social posting will be connected in the next update.' })}>
                    Post to Social
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={newAppt.client_id} onValueChange={(v) => setNewAppt({ ...newAppt, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Input value={newAppt.service_name} onChange={(e) => setNewAppt({ ...newAppt, service_name: e.target.value })} placeholder="e.g. Hydrating Facial" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={newAppt.appointment_date} onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" value={newAppt.start_time} onChange={(e) => setNewAppt({ ...newAppt, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" value={newAppt.end_time} onChange={(e) => setNewAppt({ ...newAppt, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" value={newAppt.service_price} onChange={(e) => setNewAppt({ ...newAppt, service_price: e.target.value })} placeholder="0.00" />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createAppointment.isPending}>Add Appointment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
