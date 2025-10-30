import { useState, useEffect } from 'react';
import { Cake, Plus, Settings, RefreshCw } from 'lucide-react';
import BirthdayList from '../components/birthdayList';
import AddBirthdayForm from '../components/addBirthdayForm';
import { birthdayAPI } from '../utils/api';
import { storage } from '../utils/storage';
import type { Birthday } from '../types/birthday';

function Popup() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const isCacheFresh = await storage.isCacheFresh();
      if (isCacheFresh) {
        const cached = await storage.getCachedBirthdays();
        setBirthdays(cached);
        setLoading(false);
        return;
      }

      // Fetch from API
      const data = await birthdayAPI.getBirthdays();
      setBirthdays(data);
      await storage.cacheBirthdays(data);
    } catch (err) {
      console.error('Error loading birthdays:', err);
      setError('Failed to load birthdays. Please try again.');
      
      // Try to load from cache as fallback
      const cached = await storage.getCachedBirthdays();
      if (cached.length > 0) {
        setBirthdays(cached);
        setError('Showing cached data. Unable to sync with server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await loadBirthdays();
    setSyncing(false);
  };

  const handleAddBirthday = async (data: { name: string; date: string; notes?: string }) => {
    try {
      const newBirthday = await birthdayAPI.createBirthday(data);
      setBirthdays([...birthdays, newBirthday]);
      await storage.cacheBirthdays([...birthdays, newBirthday]);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding birthday:', err);
      alert('Failed to add birthday. Please try again.');
    }
  };

  const handleDeleteBirthday = async (id: string) => {
    try {
      await birthdayAPI.deleteBirthday(id);
      const updated = birthdays.filter(b => b.id !== id);
      setBirthdays(updated);
      await storage.cacheBirthdays(updated);
    } catch (err) {
      console.error('Error deleting birthday:', err);
      alert('Failed to delete birthday. Please try again.');
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake size={24} />
            <h1 className="text-xl font-bold">Birthday Tracker</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              title="Sync with server"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            </button>
            <button
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100%-140px)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error && birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadBirthdays}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        ) : showAddForm ? (
          <AddBirthdayForm
            onSubmit={handleAddBirthday}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <>
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <BirthdayList
              birthdays={birthdays}
              onDelete={handleDeleteBirthday}
            />
            {birthdays.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Cake size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No birthdays yet!</p>
                <p className="text-sm mt-2">Click the button below to add one.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer / Add Button */}
      {!loading && !showAddForm && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add Birthday
          </button>
        </div>
      )}
    </div>
  );
}

export default Popup;