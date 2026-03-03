'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Link as LinkIcon,
  Target,
  CalendarDays,
  BarChart3,
  Shield,
  Rocket,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Metric      { id: string; label: string; value: string; unit?: string }
export interface PlannedItem { id: string; description: string; achieved: boolean; notes?: string }
export interface DailyTask   { id: string; date: string; no: number; area: string; description: string }
export interface AreaUpdated { id: string; area: string; changes: string }
export interface Risk        { id: string; title: string; impact: 'LOW' | 'MEDIUM' | 'HIGH'; mitigation: string; status: 'OPEN' | 'MITIGATED' | 'CLOSED' }
export interface Blocker     { id: string; description: string; dependency?: string; status: 'OPEN' | 'RESOLVED' }
export interface NextWeekItem { id: string; priority: number; description: string }
export interface TimeAlloc   { id: string; category: string; percentage: number }
export interface Reference   { id: string; label: string; url: string }

export interface WeeklyReportData {
  id?: string
  title: string
  developer: string
  periodStart: string
  periodEnd: string
  project: string
  purpose: string
  activeDays: string
  status: string
  summary: string
  metrics: Metric[]
  plannedItems: PlannedItem[]
  dailyTasks: DailyTask[]
  areasUpdated: AreaUpdated[]
  risks: Risk[]
  blockers: Blocker[]
  nextWeekPlan: NextWeekItem[]
  timeAllocation: TimeAlloc[]
  references: Reference[]
  notes: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

const EMPTY_FORM: WeeklyReportData = {
  title: '',
  developer: '',
  periodStart: '',
  periodEnd: '',
  project: 'CRM (Cursor development)',
  purpose: 'Submission to Head',
  activeDays: '',
  status: 'DRAFT',
  summary: '',
  metrics: [],
  plannedItems: [],
  dailyTasks: [],
  areasUpdated: [],
  risks: [],
  blockers: [],
  nextWeekPlan: [],
  timeAllocation: [],
  references: [],
  notes: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 mt-1">
      {children}
    </h3>
  )
}

function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="mt-2 w-full border-dashed text-muted-foreground hover:text-foreground">
      <Plus className="w-3.5 h-3.5 mr-1" /> {label}
    </Button>
  )
}

function DeleteRowButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} className="h-8 w-8 flex-shrink-0 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  )
}

// ─── Total % helper ───────────────────────────────────────────────────────────

function totalPct(alloc: TimeAlloc[]) {
  return alloc.reduce((s, a) => s + (Number(a.percentage) || 0), 0)
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialData?: WeeklyReportData | null
  onSaved: (report: WeeklyReportData) => void
  currentUserName?: string
}

export function WeeklyReportFormDialog({ open, onOpenChange, initialData, onSaved, currentUserName }: Props) {
  const [form, setForm] = useState<WeeklyReportData>({ ...EMPTY_FORM, developer: currentUserName || '' })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({ ...EMPTY_FORM, ...initialData })
      } else {
        setForm({ ...EMPTY_FORM, developer: currentUserName || '' })
      }
      setActiveTab('overview')
    }
  }, [open, initialData, currentUserName])

  // ── Field helpers ──────────────────────────────────────────────────────────

  const set = (field: keyof WeeklyReportData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  // Generic list updater
  function updateList<T>(field: keyof WeeklyReportData, id: string, patch: Partial<T>) {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item: any) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }))
  }

  function removeFromList(field: keyof WeeklyReportData, id: string) {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((item: any) => item.id !== id),
    }))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (submitStatus?: string) => {
    if (!form.title.trim()) { toast.error('Title is required'); setActiveTab('overview'); return }
    if (!form.periodStart) { toast.error('Period start date is required'); setActiveTab('overview'); return }
    if (!form.periodEnd)   { toast.error('Period end date is required'); setActiveTab('overview'); return }
    if (!form.project.trim()) { toast.error('Project is required'); setActiveTab('overview'); return }

    const pct = totalPct(form.timeAllocation)
    if (form.timeAllocation.length > 0 && pct !== 100) {
      toast.error(`Time allocation must total 100% (currently ${pct}%)`)
      setActiveTab('progress')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        status: submitStatus || form.status,
        activeDays: form.activeDays || null,
      }

      const isEdit = Boolean(form.id)
      const url = isEdit ? `/api/weekly-reports/${form.id}` : '/api/weekly-reports'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save report')
        return
      }

      const saved = await res.json()
      toast.success(isEdit ? 'Report updated' : 'Report created')
      onSaved(saved)
      onOpenChange(false)
    } catch {
      toast.error('Failed to save report')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col overflow-hidden p-0">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {form.id ? 'Edit Weekly Report' : 'New Weekly Report'}
            </DialogTitle>
            <DialogDescription>
              Fill in all sections for a complete, internationally-accepted weekly status report.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 mx-6 mt-3 grid grid-cols-5 h-9">
            <TabsTrigger value="overview"    className="text-xs gap-1"><CalendarDays className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="tasks"       className="text-xs gap-1"><Target       className="w-3.5 h-3.5" />Goals & Tasks</TabsTrigger>
            <TabsTrigger value="progress"    className="text-xs gap-1"><BarChart3    className="w-3.5 h-3.5" />Progress</TabsTrigger>
            <TabsTrigger value="risks"       className="text-xs gap-1"><Shield       className="w-3.5 h-3.5" />Risks</TabsTrigger>
            <TabsTrigger value="lookahead"   className="text-xs gap-1"><Rocket       className="w-3.5 h-3.5" />Looking Ahead</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* ══ TAB 1: OVERVIEW ══════════════════════════════════════════════ */}
            <TabsContent value="overview" className="mt-0 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Report Title <span className="text-red-500">*</span></Label>
                  <Input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. CRM Development – Weekly Report (Feb 23–27, 2026)" />
                </div>

                <div className="space-y-1.5">
                  <Label>Developer / Author <span className="text-red-500">*</span></Label>
                  <Input value={form.developer} onChange={e => set('developer', e.target.value)}
                    placeholder="Full name" />
                </div>

                <div className="space-y-1.5">
                  <Label>Project <span className="text-red-500">*</span></Label>
                  <Input value={form.project} onChange={e => set('project', e.target.value)}
                    placeholder="e.g. CRM (Cursor development)" />
                </div>

                <div className="space-y-1.5">
                  <Label>Period Start <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Period End <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Active Working Days</Label>
                  <Input type="number" min={0} max={7} value={form.activeDays}
                    onChange={e => set('activeDays', e.target.value)}
                    placeholder="e.g. 5" />
                </div>

                <div className="space-y-1.5">
                  <Label>Purpose / Submitted To</Label>
                  <Input value={form.purpose} onChange={e => set('purpose', e.target.value)}
                    placeholder="e.g. Submission to Head" />
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>At-a-Glance Summary</Label>
                <p className="text-xs text-muted-foreground">A short executive summary of the week for non-technical readers.</p>
                <Textarea rows={5} value={form.summary} onChange={e => set('summary', e.target.value)}
                  placeholder="Summarise the week's focus areas, key deliverables, and overall outcome in 2–4 sentences…" />
              </div>
            </TabsContent>

            {/* ══ TAB 2: GOALS & TASKS ═════════════════════════════════════════ */}
            <TabsContent value="tasks" className="mt-0 space-y-6">

              {/* Planned vs Achieved */}
              <div>
                <SectionTitle>Planned Objectives vs. Results</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">List what was planned and tick each item as achieved or not.</p>

                <div className="space-y-2">
                  {form.plannedItems.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                      <button
                        type="button"
                        onClick={() => updateList<PlannedItem>('plannedItems', item.id, { achieved: !item.achieved })}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {item.achieved
                          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                          : <Circle className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder={`Planned item ${idx + 1}…`}
                          value={item.description}
                          onChange={e => updateList<PlannedItem>('plannedItems', item.id, { description: e.target.value })}
                        />
                        <Input
                          placeholder="Result / notes (optional)…"
                          value={item.notes || ''}
                          onChange={e => updateList<PlannedItem>('plannedItems', item.id, { notes: e.target.value })}
                        />
                      </div>
                      <DeleteRowButton onClick={() => removeFromList('plannedItems', item.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add planned objective"
                  onClick={() => setForm(p => ({
                    ...p,
                    plannedItems: [...p.plannedItems, { id: uid(), description: '', achieved: false, notes: '' }],
                  }))}
                />
              </div>

              {/* Daily Task Log */}
              <div>
                <SectionTitle>Daily Task Log</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">Date | No | Area / Feature | Description</p>

                <div className="space-y-2">
                  {form.dailyTasks.map((task, idx) => (
                    <div key={task.id} className="grid grid-cols-[120px_48px_160px_1fr_32px] gap-2 items-center">
                      <Input type="date" value={task.date}
                        onChange={e => updateList<DailyTask>('dailyTasks', task.id, { date: e.target.value })} />
                      <Input type="number" min={1} value={task.no || idx + 1}
                        onChange={e => updateList<DailyTask>('dailyTasks', task.id, { no: parseInt(e.target.value) })}
                        className="text-center" />
                      <Input placeholder="Area / feature" value={task.area}
                        onChange={e => updateList<DailyTask>('dailyTasks', task.id, { area: e.target.value })} />
                      <Input placeholder="Description of work done…" value={task.description}
                        onChange={e => updateList<DailyTask>('dailyTasks', task.id, { description: e.target.value })} />
                      <DeleteRowButton onClick={() => removeFromList('dailyTasks', task.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add task entry"
                  onClick={() => setForm(p => ({
                    ...p,
                    dailyTasks: [...p.dailyTasks, { id: uid(), date: '', no: p.dailyTasks.length + 1, area: '', description: '' }],
                  }))}
                />
              </div>
            </TabsContent>

            {/* ══ TAB 3: PROGRESS ══════════════════════════════════════════════ */}
            <TabsContent value="progress" className="mt-0 space-y-6">

              {/* Quantitative Metrics */}
              <div>
                <SectionTitle>Quantitative Metrics / KPIs</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">e.g. Tasks Closed: 12, PRs Merged: 3, Bugs Fixed: 5</p>
                <div className="grid grid-cols-2 gap-2">
                  {form.metrics.map(m => (
                    <div key={m.id} className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30">
                      <Input placeholder="Label (e.g. Tasks Closed)" value={m.label}
                        onChange={e => updateList<Metric>('metrics', m.id, { label: e.target.value })} />
                      <Input placeholder="Value" value={m.value}
                        onChange={e => updateList<Metric>('metrics', m.id, { value: e.target.value })} className="w-24" />
                      <Input placeholder="Unit" value={m.unit || ''}
                        onChange={e => updateList<Metric>('metrics', m.id, { unit: e.target.value })} className="w-16" />
                      <DeleteRowButton onClick={() => removeFromList('metrics', m.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add metric"
                  onClick={() => setForm(p => ({ ...p, metrics: [...p.metrics, { id: uid(), label: '', value: '', unit: '' }] }))}
                />
              </div>

              {/* Areas Updated */}
              <div>
                <SectionTitle>Areas of the System Updated</SectionTitle>
                <div className="space-y-2">
                  {form.areasUpdated.map(a => (
                    <div key={a.id} className="flex gap-2 items-start">
                      <Input placeholder="Area / module" value={a.area}
                        onChange={e => updateList<AreaUpdated>('areasUpdated', a.id, { area: e.target.value })}
                        className="w-48 flex-shrink-0" />
                      <Input placeholder="What changed…" value={a.changes}
                        onChange={e => updateList<AreaUpdated>('areasUpdated', a.id, { changes: e.target.value })} />
                      <DeleteRowButton onClick={() => removeFromList('areasUpdated', a.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add area"
                  onClick={() => setForm(p => ({ ...p, areasUpdated: [...p.areasUpdated, { id: uid(), area: '', changes: '' }] }))}
                />
              </div>

              {/* Time Allocation */}
              <div>
                <SectionTitle>Time / Effort Allocation</SectionTitle>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground">Percentages should total 100%.</p>
                  <Badge variant={totalPct(form.timeAllocation) === 100 ? 'default' : 'destructive'} className="text-xs">
                    {totalPct(form.timeAllocation)}% / 100%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {form.timeAllocation.map(t => (
                    <div key={t.id} className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30">
                      <Input placeholder="Category (e.g. Feature development)" value={t.category}
                        onChange={e => updateList<TimeAlloc>('timeAllocation', t.id, { category: e.target.value })} />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Input type="number" min={0} max={100} value={t.percentage}
                          onChange={e => updateList<TimeAlloc>('timeAllocation', t.id, { percentage: parseInt(e.target.value) || 0 })}
                          className="w-16 text-center" />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <DeleteRowButton onClick={() => removeFromList('timeAllocation', t.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add category"
                  onClick={() => setForm(p => ({ ...p, timeAllocation: [...p.timeAllocation, { id: uid(), category: '', percentage: 0 }] }))}
                />
              </div>
            </TabsContent>

            {/* ══ TAB 4: RISKS & BLOCKERS ══════════════════════════════════════ */}
            <TabsContent value="risks" className="mt-0 space-y-6">

              {/* Risks */}
              <div>
                <SectionTitle>Risks & Issues</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">Document current risks with their impact and mitigation plan.</p>
                <div className="space-y-3">
                  {form.risks.map(r => (
                    <div key={r.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex gap-2 items-center">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${r.impact === 'HIGH' ? 'text-red-500' : r.impact === 'MEDIUM' ? 'text-amber-500' : 'text-blue-400'}`} />
                        <Input placeholder="Risk title…" value={r.title}
                          onChange={e => updateList<Risk>('risks', r.id, { title: e.target.value })} className="flex-1" />
                        <Select value={r.impact} onValueChange={v => updateList<Risk>('risks', r.id, { impact: v as Risk['impact'] })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={r.status} onValueChange={v => updateList<Risk>('risks', r.id, { status: v as Risk['status'] })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="MITIGATED">Mitigated</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <DeleteRowButton onClick={() => removeFromList('risks', r.id)} />
                      </div>
                      <Input placeholder="Mitigation plan…" value={r.mitigation}
                        onChange={e => updateList<Risk>('risks', r.id, { mitigation: e.target.value })} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add risk"
                  onClick={() => setForm(p => ({
                    ...p,
                    risks: [...p.risks, { id: uid(), title: '', impact: 'MEDIUM', mitigation: '', status: 'OPEN' }],
                  }))}
                />
              </div>

              {/* Blockers */}
              <div>
                <SectionTitle>Blockers & Dependencies</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">What is blocking progress? Note external dependencies.</p>
                <div className="space-y-2">
                  {form.blockers.map(b => (
                    <div key={b.id} className="grid grid-cols-[1fr_180px_120px_32px] gap-2 items-center">
                      <Input placeholder="Blocker description…" value={b.description}
                        onChange={e => updateList<Blocker>('blockers', b.id, { description: e.target.value })} />
                      <Input placeholder="Dependency (team/person)" value={b.dependency || ''}
                        onChange={e => updateList<Blocker>('blockers', b.id, { dependency: e.target.value })} />
                      <Select value={b.status} onValueChange={v => updateList<Blocker>('blockers', b.id, { status: v as Blocker['status'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <DeleteRowButton onClick={() => removeFromList('blockers', b.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add blocker"
                  onClick={() => setForm(p => ({
                    ...p,
                    blockers: [...p.blockers, { id: uid(), description: '', dependency: '', status: 'OPEN' }],
                  }))}
                />
              </div>
            </TabsContent>

            {/* ══ TAB 5: LOOKING AHEAD ════════════════════════════════════════ */}
            <TabsContent value="lookahead" className="mt-0 space-y-6">

              {/* Next Week Plan */}
              <div>
                <SectionTitle>Plan for Next Week</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">List 3–7 prioritised items planned for the next reporting period.</p>
                <div className="space-y-2">
                  {form.nextWeekPlan.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <Input placeholder="Planned task / objective…" value={item.description}
                        onChange={e => updateList<NextWeekItem>('nextWeekPlan', item.id, { description: e.target.value })}
                        className="flex-1" />
                      <DeleteRowButton onClick={() => removeFromList('nextWeekPlan', item.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add next-week item"
                  onClick={() => setForm(p => ({
                    ...p,
                    nextWeekPlan: [...p.nextWeekPlan, { id: uid(), priority: p.nextWeekPlan.length + 1, description: '' }],
                  }))}
                />
              </div>

              {/* References */}
              <div>
                <SectionTitle>References & Links</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">PRs, tickets, documents, or any relevant links.</p>
                <div className="space-y-2">
                  {form.references.map(r => (
                    <div key={r.id} className="flex gap-2 items-center">
                      <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Input placeholder="Label (e.g. PR #42 – Fix approval bug)" value={r.label}
                        onChange={e => updateList<Reference>('references', r.id, { label: e.target.value })}
                        className="w-64 flex-shrink-0" />
                      <Input placeholder="URL or ID" value={r.url}
                        onChange={e => updateList<Reference>('references', r.id, { url: e.target.value })} />
                      <DeleteRowButton onClick={() => removeFromList('references', r.id)} />
                    </div>
                  ))}
                </div>
                <AddRowButton
                  label="Add reference"
                  onClick={() => setForm(p => ({
                    ...p,
                    references: [...p.references, { id: uid(), label: '', url: '' }],
                  }))}
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <SectionTitle>Additional Notes</SectionTitle>
                <Textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Any additional context, observations, or free-form notes for the reader…" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={loading}>
              {loading ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button type="button" onClick={() => handleSubmit('SUBMITTED')} disabled={loading}>
              {loading ? 'Submitting…' : 'Save & Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
