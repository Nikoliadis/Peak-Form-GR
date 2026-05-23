'use client';

import { Dumbbell, Plus } from 'lucide-react';

export default function ProgramsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Προγράμματα</h1>
          <p className="text-gray-400 text-sm mt-1">Δημιούργησε και διαχειρίσου workout programs</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Νέο Program
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Dumbbell size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Δεν έχεις programs ακόμα</p>
          <p className="text-gray-500 text-sm mt-1">Δημιούργησε το πρώτο workout program για τους athletes σου</p>
          <button className="btn-primary mt-6 flex items-center gap-2">
            <Plus size={18} />
            Δημιούργησε Program
          </button>
        </div>
      </div>
    </div>
  );
}
