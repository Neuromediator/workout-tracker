import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  type TooltipProps,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchProgressSummary,
  fetchWeeklyCounts,
  fetchPersonalBests,
  fetchExerciseTrend,
  type ProgressSummary,
  type WeeklyCount,
  type PersonalBest,
  type ExerciseTrendPoint,
} from '@/api/progress'
import { TrendingUp, Trophy, Activity, Dumbbell, Weight, Flame, Zap } from 'lucide-react'

// Resolved color tokens for recharts (CSS vars don't work in SVG fills reliably)
const CHART_COLORS = {
  amber: 'oklch(0.78 0.12 70)',
  amberMuted: 'oklch(0.78 0.12 70 / 0.15)',
  amberGlow: 'oklch(0.78 0.12 70 / 0.4)',
  copper: 'oklch(0.65 0.15 45)',
  copperMuted: 'oklch(0.65 0.15 45 / 0.1)',
  gridLine: 'oklch(0.28 0.006 250)',
  axisText: 'oklch(0.55 0.01 250)',
  tooltipBg: 'oklch(0.20 0.008 250)',
  tooltipBorder: 'oklch(0.30 0.008 250)',
  tooltipText: 'oklch(0.88 0.01 80)',
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: `0 8px 32px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(1 0 0 / 0.03) inset`,
      }}
    >
      <p style={{ color: CHART_COLORS.axisText, fontSize: '11px', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: entry.color,
              boxShadow: `0 0 6px ${entry.color}`,
            }}
          />
          <span style={{ color: CHART_COLORS.tooltipText, fontSize: '12px', fontWeight: 600 }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
          <span style={{ color: CHART_COLORS.axisText, fontSize: '11px' }}>
            {entry.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Progress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [weekly, setWeekly] = useState<WeeklyCount[]>([])
  const [bests, setBests] = useState<PersonalBest[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [trend, setTrend] = useState<ExerciseTrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchProgressSummary(),
      fetchWeeklyCounts(),
      fetchPersonalBests(),
    ])
      .then(([s, w, b]) => {
        setSummary(s)
        setWeekly(w)
        setBests(b)
        if (b.length > 0) {
          setSelectedExercise(b[0].exercise_id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedExercise) return
    fetchExerciseTrend(selectedExercise).then(setTrend).catch(console.error)
  }, [selectedExercise])

  const parseUTC = (dateStr: string) =>
    new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z')

  const formatTrendDate = (dateStr: string) => {
    return parseUTC(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-pulse rounded-full bg-warm/30" />
      </div>
    )
  }

  const maxWeekly = Math.max(...weekly.map((w) => w.count), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Progress
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your training over time
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={<Zap className="h-4 w-4" />}
            label="This Week"
            value={summary.this_week}
            accent
          />
          <SummaryCard
            icon={<Activity className="h-4 w-4" />}
            label="This Month"
            value={summary.this_month}
          />
          <SummaryCard
            icon={<Dumbbell className="h-4 w-4" />}
            label="Total Sessions"
            value={summary.total_sessions}
          />
          <SummaryCard
            icon={<Weight className="h-4 w-4" />}
            label="Total Volume"
            value={summary.total_volume > 1000
              ? `${(summary.total_volume / 1000).toFixed(1)}t`
              : `${summary.total_volume}kg`
            }
          />
        </div>
      )}

      {/* Weekly frequency chart */}
      {weekly.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          {/* Subtle glow behind chart */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-warm/[0.04] blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm/10">
                <Flame className="h-3.5 w-3.5 text-warm" />
              </div>
              <h2 className="font-heading text-base font-semibold">Workouts per Week</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0.8} />
                  </linearGradient>
                  <filter id="barGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.gridLine}
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axisText, fontWeight: 500 }}
                  axisLine={{ stroke: CHART_COLORS.gridLine }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: CHART_COLORS.axisText }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  domain={[0, Math.max(maxWeekly + 1, 4)]}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(1 0 0 / 0.03)' }} />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[6, 6, 2, 2]}
                  name="Workouts"
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Exercise trend */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
        <div className="pointer-events-none absolute -top-20 right-1/4 h-40 w-1/2 rounded-full bg-warm/[0.03] blur-3xl" />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm/10">
                <TrendingUp className="h-3.5 w-3.5 text-warm" />
              </div>
              <h2 className="font-heading text-base font-semibold">Exercise Trend</h2>
            </div>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-[200px]">
                <span className="truncate">
                  {bests.find((b) => b.exercise_id === selectedExercise)?.exercise_name || 'Select exercise'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {bests.map((b) => (
                  <SelectItem key={b.exercise_id} value={b.exercise_id}>
                    {b.exercise_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend.map((t) => ({ ...t, date: formatTrendDate(t.date) }))}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.copper} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.gridLine}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axisText, fontWeight: 500 }}
                  axisLine={{ stroke: CHART_COLORS.gridLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.axisText }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total_volume"
                  stroke={CHART_COLORS.copper}
                  strokeWidth={1.5}
                  fill="url(#volumeGradient)"
                  name="Volume"
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_COLORS.copper, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="max_weight"
                  stroke={CHART_COLORS.amber}
                  strokeWidth={2.5}
                  fill="url(#weightGradient)"
                  name="Max Weight (kg)"
                  dot={{
                    r: 4,
                    fill: CHART_COLORS.amber,
                    strokeWidth: 2,
                    stroke: 'oklch(0.17 0.005 250)',
                  }}
                  activeDot={{
                    r: 6,
                    fill: CHART_COLORS.amber,
                    strokeWidth: 2,
                    stroke: 'oklch(0.17 0.005 250)',
                    style: { filter: `drop-shadow(0 0 6px ${CHART_COLORS.amberGlow})` },
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              {selectedExercise
                ? 'No data yet for this exercise'
                : 'Select an exercise to see trends'}
            </div>
          )}
        </div>
      </div>

      {/* Personal bests */}
      {bests.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-1/2 rounded-full bg-warm/[0.04] blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm/10">
                <Trophy className="h-3.5 w-3.5 text-warm" />
              </div>
              <h2 className="font-heading text-base font-semibold">Personal Bests</h2>
            </div>
            <div className="space-y-1">
              {bests.map((b, i) => (
                <div
                  key={b.exercise_id}
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-warm/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{b.exercise_name}</p>
                      <p className="text-xs text-muted-foreground">{b.muscle_group}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-warm">
                      {b.weight}<span className="text-xs font-medium text-warm/60">kg</span>
                      {' '}
                      <span className="text-muted-foreground">×</span>
                      {' '}
                      {b.reps}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {parseUTC(b.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary || summary.total_sessions === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Complete some workouts to see your progress here.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
        accent
          ? 'border-warm/20 bg-warm/[0.06]'
          : 'border-border/50 bg-card'
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-warm/10 blur-2xl" />
      )}
      <div className="relative">
        <div className={`flex items-center gap-2 ${accent ? 'text-warm' : 'text-muted-foreground'}`}>
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="mt-2 font-heading text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  )
}
