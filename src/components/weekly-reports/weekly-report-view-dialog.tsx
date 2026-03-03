'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Link as LinkIcon,
  User,
  CalendarDays,
  FolderOpen,
  Clock,
  Target,
} from 'lucide-react'
import type {
  WeeklyReportData,
  Metric,
  PlannedItem,
  DailyTask,
  AreaUpdated,
  Risk,
  Blocker,
  NextWeekItem,
  TimeAlloc,
  Reference,
} from './weekly-report-form-dialog'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  APPROVED:  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  REVIEWED:  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

const IMPACT_STYLE: Record<string, string> = {
  LOW:    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  HIGH:   'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const RISK_STATUS_STYLE: Record<string, string> = {
  OPEN:      'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  MITIGATED: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
  CLOSED:    'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
}

const fmtDate = (d: string | Date) => {
  try { return format(new Date(d), 'dd MMM yyyy') } catch { return String(d) }
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 pt-1">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
        {children}
      </h3>
      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic">{text}</p>
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  report: WeeklyReportData | null
}

export function WeeklyReportViewDialog({ open, onOpenChange, report }: Props) {
  if (!report) return null

  const metrics       = (report.metrics       as Metric[]      ) || []
  const plannedItems  = (report.plannedItems  as PlannedItem[] ) || []
  const dailyTasks    = (report.dailyTasks    as DailyTask[]   ) || []
  const areasUpdated  = (report.areasUpdated  as AreaUpdated[] ) || []
  const risks         = (report.risks         as Risk[]        ) || []
  const blockers      = (report.blockers      as Blocker[]     ) || []
  const nextWeekPlan  = (report.nextWeekPlan  as NextWeekItem[]) || []
  const timeAllocation = (report.timeAllocation as TimeAlloc[] ) || []
  const references    = (report.references   as Reference[]   ) || []

  const statusLabel: Record<string, string> = {
    DRAFT: 'Draft', SUBMITTED: 'Submitted', APPROVED: 'Approved', REVIEWED: 'Reviewed',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col overflow-hidden p-0">
        {/* ── Cover / header ── */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white px-8 py-6 rounded-t-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-white leading-snug">
                  {report.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300 mt-2">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{report.developer}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />
                    {fmtDate(report.periodStart)} – {fmtDate(report.periodEnd)}
                  </span>
                  <span className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" />{report.project}</span>
                  {report.activeDays && (
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{report.activeDays} active day{Number(report.activeDays) !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <Badge className={`${STATUS_STYLE[report.status]} text-xs font-semibold mt-1 flex-shrink-0`}>
                {statusLabel[report.status] || report.status}
              </Badge>
            </div>
            {report.purpose && (
              <p className="text-xs text-slate-400 mt-2">{report.purpose}</p>
            )}
          </DialogHeader>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

          {/* At-a-Glance */}
          {report.summary && (
            <div>
              <SectionHeading>At a Glance</SectionHeading>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {report.summary}
              </p>
            </div>
          )}

          {/* Metrics KPI cards */}
          {metrics.length > 0 && (
            <div>
              <SectionHeading>Quantitative Metrics</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {metrics.map(m => (
                  <div key={m.id} className="bg-white dark:bg-slate-800 rounded-lg border p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-primary">{m.value}<span className="text-sm font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planned vs Achieved */}
          {plannedItems.length > 0 && (
            <div>
              <SectionHeading>Planned Objectives vs. Results</SectionHeading>
              <div className="space-y-2">
                {plannedItems.map((item, idx) => (
                  <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${item.achieved ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {item.achieved
                        ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                        : <Circle className="w-4.5 h-4.5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{idx + 1}. {item.description}</p>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.notes}</p>}
                    </div>
                    <Badge variant={item.achieved ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                      {item.achieved ? 'Achieved' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{plannedItems.filter(i => i.achieved).length} achieved</span>
                <span className="flex items-center gap-1"><Circle className="w-3.5 h-3.5 text-gray-400" />{plannedItems.filter(i => !i.achieved).length} pending</span>
              </div>
            </div>
          )}

          {/* Daily Task Log */}
          {dailyTasks.length > 0 && (
            <div>
              <SectionHeading>Daily Task Log</SectionHeading>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-32">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-10">No</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-40">Area / Feature</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dailyTasks.map(t => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground">{t.date ? fmtDate(t.date) : '—'}</td>
                        <td className="px-3 py-2 text-center font-medium">{t.no}</td>
                        <td className="px-3 py-2 font-medium">{t.area}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Areas Updated */}
          {areasUpdated.length > 0 && (
            <div>
              <SectionHeading>Areas of the System Updated</SectionHeading>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-48">Area / Module</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">What Changed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {areasUpdated.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-medium">{a.area}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{a.changes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Time Allocation */}
          {timeAllocation.length > 0 && (
            <div>
              <SectionHeading>Time / Effort Allocation</SectionHeading>
              <div className="space-y-2">
                {timeAllocation.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-52 flex-shrink-0">{t.category}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, t.percentage)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary w-12 text-right">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <div>
              <SectionHeading>Risks & Issues</SectionHeading>
              <div className="space-y-3">
                {risks.map(r => (
                  <div key={r.id} className="flex gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800/50 shadow-sm">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${r.impact === 'HIGH' ? 'text-red-500' : r.impact === 'MEDIUM' ? 'text-amber-500' : 'text-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.title}</p>
                        <Badge className={`text-xs ${IMPACT_STYLE[r.impact]}`}>{r.impact} impact</Badge>
                        <Badge className={`text-xs ${RISK_STATUS_STYLE[r.status]}`}>{r.status}</Badge>
                      </div>
                      {r.mitigation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Mitigation: {r.mitigation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockers */}
          {blockers.length > 0 && (
            <div>
              <SectionHeading>Blockers & Dependencies</SectionHeading>
              <div className="space-y-2">
                {blockers.map(b => (
                  <div key={b.id} className={`flex items-start gap-3 p-3 rounded-lg border ${b.status === 'RESOLVED' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{b.description}</p>
                      {b.dependency && (
                        <p className="text-xs text-muted-foreground mt-0.5">Dependency: {b.dependency}</p>
                      )}
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ${b.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Week Plan */}
          {nextWeekPlan.length > 0 && (
            <div>
              <SectionHeading>Plan for Next Week</SectionHeading>
              <ol className="space-y-2">
                {nextWeekPlan.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* References */}
          {references.length > 0 && (
            <div>
              <SectionHeading>References & Links</SectionHeading>
              <div className="space-y-1.5">
                {references.map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {r.label || r.url}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div>
              <SectionHeading>Additional Notes</SectionHeading>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {report.notes}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!report.summary && metrics.length === 0 && plannedItems.length === 0 && dailyTasks.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <EmptyNote text="No content recorded yet. Edit the report to fill in all sections." />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
