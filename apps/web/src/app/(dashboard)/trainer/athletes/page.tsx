'use client';

import { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';

export default function AthletesPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/users/trainer/invite', { athleteEmail: email });
      setMessage({ type: 'success', text: 'Ο athlete προστέθηκε επιτυχώς!' });
      setEmail('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Κάτι πήγε στραβά' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Athletes</h1>
          <p className="text-gray-400 text-sm mt-1">Διαχειρίσου τους athletes σου</p>
        </div>
      </div>

      {/* Invite */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-brand-400" />
          Πρόσθεσε Athlete
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@example.com"
            className="input-field flex-1"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? 'Προσθήκη...' : 'Προσθήκη'}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Athletes List */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input placeholder="Αναζήτηση athlete..." className="input-field pl-9" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Δεν έχεις athletes ακόμα</p>
          <p className="text-gray-500 text-sm mt-1">Πρόσθεσε τον πρώτο athlete σου παραπάνω</p>
        </div>
      </div>
    </div>
  );
}
