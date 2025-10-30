import { format, parseISO } from 'date-fns';
import { Trash2, Cake } from 'lucide-react';
import type { BirthdayWithDaysUntil } from '../types/birthday';

interface BirthdayItemProps {
  birthday: BirthdayWithDaysUntil;
  onDelete: (id: string) => void;
}

function BirthdayItem({ birthday, onDelete }: BirthdayItemProps) {
  const birthdayDate = parseISO(birthday.date);
  const formattedDate = format(birthdayDate, 'MMM d');
  
  const getDaysText = () => {
    if (birthday.isToday) return 'Today! 🎂';
    if (birthday.daysUntil === 1) return 'Tomorrow';
    if (birthday.daysUntil < 7) return `In ${birthday.daysUntil} days`;
    if (birthday.daysUntil < 30) return `In ${Math.floor(birthday.daysUntil / 7)} weeks`;
    return `In ${Math.floor(birthday.daysUntil / 30)} months`;
  };

  const handleDelete = () => {
    if (confirm(`Delete birthday for ${birthday.name}?`)) {
      onDelete(birthday.id);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        birthday.isToday
          ? 'bg-purple-50 border-purple-300 shadow-md'
          : birthday.isSoon
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Cake size={18} className={birthday.isToday ? 'text-purple-600' : 'text-gray-400'} />
            <h3 className="font-semibold text-gray-900">{birthday.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{formattedDate}</span>
            <span className="text-gray-400">•</span>
            <span className={birthday.isToday || birthday.isSoon ? 'font-medium text-purple-600' : ''}>
              {getDaysText()}
            </span>
          </div>
          {birthday.notes && (
            <p className="mt-2 text-sm text-gray-600">{birthday.notes}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default BirthdayItem;