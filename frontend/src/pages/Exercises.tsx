import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchExercises, createExercise, deleteExercise, type Exercise } from '@/api/exercises'
import { Search, Plus, Trash2, Dumbbell } from 'lucide-react'

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core']

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-500/15 text-red-400 ring-red-500/20',
  back: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  legs: 'bg-green-500/15 text-green-400 ring-green-500/20',
  shoulders: 'bg-purple-500/15 text-purple-400 ring-purple-500/20',
  arms: 'bg-orange-500/15 text-orange-400 ring-orange-500/20',
  core: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/20',
}

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newMuscleGroup, setNewMuscleGroup] = useState('chest')
  const [newTags, setNewTags] = useState('')

  const load = async () => {
    try {
      const data = await fetchExercises()
      setExercises(data)
    } catch (err) {
      console.error('Failed to load exercises', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (muscleFilter !== 'all' && e.muscle_group !== muscleFilter) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [exercises, search, muscleFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createExercise({
        name: newName,
        description: newDescription,
        muscle_group: newMuscleGroup,
        tags: newTags ? newTags.split(',').map((t) => t.trim()) : [],
      })
      setDialogOpen(false)
      setNewName('')
      setNewDescription('')
      setNewTags('')
      load()
    } catch (err) {
      console.error('Failed to create exercise', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExercise(id)
      load()
    } catch (err) {
      console.error('Failed to delete exercise', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Dumbbell className="h-6 w-6 animate-pulse text-warm" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">Exercise Library</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} exercises</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-warm text-warm-foreground hover:bg-warm/90">
            <Plus className="mr-1 h-4 w-4" /> Add Exercise
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Exercise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Muscle Group</Label>
                <Select value={newMuscleGroup} onValueChange={setNewMuscleGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.filter((g) => g !== 'all').map((g) => (
                      <SelectItem key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="barbell, compound"
                />
              </div>
              <Button type="submit" className="w-full bg-warm text-warm-foreground hover:bg-warm/90">
                Create Exercise
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setMuscleFilter(g)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                muscleFilter === g
                  ? 'bg-warm/15 text-warm ring-1 ring-warm/30'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-muted-foreground">
          <Dumbbell className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">No exercises found</p>
          <p className="mt-1 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="group rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-card/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium leading-tight text-foreground">
                    {exercise.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {exercise.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                      MUSCLE_COLORS[exercise.muscle_group] || 'bg-secondary text-secondary-foreground ring-border'
                    }`}>
                      {exercise.muscle_group}
                    </span>
                    {exercise.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-inset ring-border/50"
                      >
                        {tag}
                      </span>
                    ))}
                    {exercise.is_custom && (
                      <Badge className="bg-warm/15 text-warm text-[11px]">Custom</Badge>
                    )}
                  </div>
                </div>
                {exercise.is_custom && (
                  <button
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => handleDelete(exercise.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
