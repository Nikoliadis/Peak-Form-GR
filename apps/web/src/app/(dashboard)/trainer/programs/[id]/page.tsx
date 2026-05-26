'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Dumbbell, ChevronDown, ChevronUp, Edit2, Check, X, Moon, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutProgram, WorkoutDay, WorkoutExercise } from '@/types';
import ExercisePicker from './ExercisePicker';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProgramBuilderPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  useEffect(() => {
    api.get(`/programs/${id}`).then(({ data }) => {
      setProgram(data);
      setNameValue(data.name);
      if (data.weeks?.[0]?.days?.length) {
        setExpandedDays(new Set(data.weeks[0].days.map((d: WorkoutDay) => d.id)));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const currentWeek = program?.weeks[activeWeek];

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(dayId) ? next.delete(dayId) : next.add(dayId);
      return next;
    });
  };

  const addDay = async (weekId: string) => {
    const week = program!.weeks.find(w => w.id === weekId)!;
    const usedNumbers = new Set(week.days.map(d => d.dayNumber));
    const dayNumber = [1, 2, 3, 4, 5, 6, 7].find(n => !usedNumbers.has(n));
    if (!dayNumber) return;
    const dayNames: Record<number, string> = { 1: 'Δευτέρα', 2: 'Τρίτη', 3: 'Τετάρτη', 4: 'Πέμπτη', 5: 'Παρασκευή', 6: 'Σάββατο', 7: 'Κυριακή' };
    const { data } = await api.post(`/programs/${id}/days`, { weekId, name: dayNames[dayNumber] ?? `Day ${dayNumber}`, dayNumber });
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => w.id === weekId ? { ...w, days: [...w.days, data] } : w),
      };
    });
    setExpandedDays(prev => new Set([...prev, data.id]));
  };

  const toggleRestDay = async (dayId: string, isRestDay: boolean) => {
    await api.put(`/programs/${id}/days/${dayId}`, { isRestDay });
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => d.id === dayId ? { ...d, isRestDay } : d),
        })),
      };
    });
  };

  const deleteDay = async (dayId: string, weekId: string) => {
    if (!confirm('Διαγραφή ημέρας;')) return;
    await api.delete(`/programs/${id}/days/${dayId}`);
    setProgram(prev => {
      if (!prev) return prev;
      return { ...prev, weeks: prev.weeks.map(w => w.id === weekId ? { ...w, days: w.days.filter(d => d.id !== dayId) } : w) };
    });
  };

  const addExercise = async (dayId: string, exerciseId: string) => {
    const { data } = await api.post(`/programs/${id}/days/${dayId}/exercises`, { exerciseId, sets: 3, reps: '8-12' });
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, data] } : d),
        })),
      };
    });
  };

  const removeExercise = async (dayId: string, weId: string) => {
    await api.delete(`/programs/${id}/days/${dayId}/exercises/${weId}`);
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== weId) } : d),
        })),
      };
    });
  };

  const updateExercise = async (dayId: string, weId: string, field: string, value: string | number | null) => {
    await api.put(`/programs/${id}/days/${dayId}/exercises/${weId}`, { [field]: value });
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => d.id === dayId ? {
            ...d,
            exercises: d.exercises.map(e => e.id === weId ? { ...e, [field]: value } : e),
          } : d),
        })),
      };
    });
  };

  const saveName = async () => {
    if (!nameValue.trim()) return;
    await api.put(`/programs/${id}`, { name: nameValue });
    setProgram(prev => prev ? { ...prev, name: nameValue } : prev);
    setEditingName(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="card h-48" />
      </div>
    );
  }

  if (!program) return <div className="text-gray-500">Program not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/trainer/programs')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="input-field py-1.5 text-xl font-bold"
                autoFocus
              />
              <button onClick={saveName} className="p-1.5 rounded-lg bg-brand-600 text-white"><Check size={16} /></button>
              <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{program.name}</h1>
              <button onClick={() => setEditingName(true)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all">
                <Edit2 size={15} />
              </button>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-0.5">
            {program.durationWeeks} εβδομάδες
            {program.goal && <> · <span className="text-brand-500 dark:text-brand-400">{program.goal}</span></>}
          </p>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {program.weeks.map((week, i) => (
          <button
            key={week.id}
            onClick={() => setActiveWeek(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeWeek === i
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Εβδομάδα {week.weekNumber}
            {week.days.length > 0 && <span className="ml-1.5 text-xs opacity-70">{week.days.length}</span>}
          </button>
        ))}
      </div>

      {/* Days */}
      {currentWeek && (
        <div className="space-y-3">
          {currentWeek.days.length === 0 && (
            <div className="card text-center py-10">
              <Dumbbell size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Δεν υπάρχουν μέρες ακόμα</p>
            </div>
          )}

          {currentWeek.days.map(day => (
            <DayCard
              key={day.id}
              day={day}
              expanded={expandedDays.has(day.id)}
              onToggle={() => toggleDay(day.id)}
              onDelete={() => deleteDay(day.id, currentWeek.id)}
              onToggleRest={(v) => toggleRestDay(day.id, v)}
              onAddExercise={() => setPickerDayId(day.id)}
              onRemoveExercise={(weId) => removeExercise(day.id, weId)}
              onUpdateExercise={(weId, field, val) => updateExercise(day.id, weId, field, val)}
            />
          ))}

          {currentWeek.days.length < 7 && (
            <button
              onClick={() => addDay(currentWeek.id)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-all"
            >
              <Plus size={16} />
              Προσθήκη Ημέρας
            </button>
          )}
        </div>
      )}

      {pickerDayId && (
        <ExercisePicker
          onClose={() => setPickerDayId(null)}
          onSelect={(exerciseId) => {
            addExercise(pickerDayId, exerciseId);
            setPickerDayId(null);
          }}
          existingIds={
            currentWeek?.days.find(d => d.id === pickerDayId)?.exercises.map(e => e.exerciseId) ?? []
          }
        />
      )}
    </div>
  );
}

interface DayCardProps {
  day: WorkoutDay;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleRest: (v: boolean) => void;
  onAddExercise: () => void;
  onRemoveExercise: (weId: string) => void;
  onUpdateExercise: (weId: string, field: string, value: string | number | null) => void;
}

function DayCard({ day, expanded, onToggle, onDelete, onToggleRest, onAddExercise, onRemoveExercise, onUpdateExercise }: DayCardProps) {
  return (
    <div className={`card p-0 overflow-hidden ${day.isRestDay ? 'opacity-75' : ''}`}>
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white">{day.name}</p>
              {day.isRestDay && (
                <span className="flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
                  <Moon size={10} /> Ανάπαυση
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {day.isRestDay ? 'Ημέρα ανάπαυσης' : `${day.exercises.length} ασκήσεις`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRest(!day.isRestDay); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              day.isRestDay
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-indigo-400 hover:text-indigo-400'
            }`}
          >
            {day.isRestDay ? <Zap size={12} /> : <Moon size={12} />}
            {day.isRestDay ? 'Προπόνηση' : 'Rest Day'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && !day.isRestDay && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {day.exercises.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Δεν υπάρχουν ασκήσεις ακόμα</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {day.exercises.map((we, idx) => (
                <ExerciseRow
                  key={we.id}
                  we={we}
                  idx={idx}
                  onRemove={() => onRemoveExercise(we.id)}
                  onUpdate={(field, val) => onUpdateExercise(we.id, field, val)}
                />
              ))}
            </div>
          )}
          <div className="px-5 py-3">
            <button
              onClick={onAddExercise}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-500 dark:text-brand-400 hover:text-brand-600 transition-colors"
            >
              <Plus size={15} />
              Προσθήκη Άσκησης
            </button>
          </div>
        </div>
      )}

      {expanded && day.isRestDay && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-8 text-center">
          <Moon size={24} className="text-indigo-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Ημέρα ανάπαυσης — χωρίς προπόνηση</p>
        </div>
      )}
    </div>
  );
}

interface ExerciseRowProps {
  we: WorkoutExercise;
  idx: number;
  onRemove: () => void;
  onUpdate: (field: string, value: string | number | null) => void;
}

function ExerciseRow({ we, idx, onRemove, onUpdate }: ExerciseRowProps) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/30">
      <span className="text-xs text-gray-400 w-5 text-center font-mono">{idx + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{we.exercise.name}</p>
        {we.exercise.muscleGroup && (
          <p className="text-xs text-gray-400">{we.exercise.muscleGroup}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={we.sets}
            onChange={e => onUpdate('sets', parseInt(e.target.value) || 1)}
            className="w-10 text-center text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            min={1}
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="text"
            value={we.reps}
            onChange={e => onUpdate('reps', e.target.value)}
            className="w-16 text-center text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            placeholder="8-12"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={we.weight ?? ''}
            onChange={e => onUpdate('weight', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-14 text-center text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            placeholder="kg"
          />
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
