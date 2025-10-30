import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import BirthdayItem from './birthdayItem';
import type { Birthday, BirthdayWithDaysUntil } from '../types/birthday';

interface BirthdayListProps {
  birthdays: Birthday[];
  onDelete: (id: string) => void;
}

function BirthdayList({ birthdays, onDelete }: BirthdayListProps) {
  const enrichedBirthdays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return birthdays
      .map((birthday): BirthdayWithDaysUntil => {
        const birthdayDate = parseISO(birthday.date);
        
        // Get this year's birthday
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthdayDate.getMonth(),
          birthdayDate.getDate()
        );

        // If this year's birthday has passed, use next year
        const targetDate = thisYearBirthday < today
          ? new Date(today.getFullYear() + 1, birthdayDate.getMonth(), birthdayDate.getDate())
          : thisYearBirthday;

        const daysUntil = differenceInDays(targetDate, today);
        const isToday = daysUntil === 0;
        const isSoon = daysUntil <= (birthday.reminderDays || 7) && daysUntil >= 0;

        return {
          ...birthday,
          daysUntil,
          isToday,
          isSoon,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays]);

  // Group birthdays
  const todayBirthdays = enrichedBirthdays.filter(b => b.isToday);
  const upcomingBirthdays = enrichedBirthdays.filter(b => b.isSoon && !b.isToday);
  const otherBirthdays = enrichedBirthdays.filter(b => !b.isSoon && !b.isToday);

  return (
    <div className="space-y-6">
      {todayBirthdays.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-purple-600 mb-3">🎉 Today</h2>
          <div className="space-y-2">
            {todayBirthdays.map(birthday => (
              <BirthdayItem
                key={birthday.id}
                birthday={birthday}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {upcomingBirthdays.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📅 Coming Soon</h2>
          <div className="space-y-2">
            {upcomingBirthdays.map(birthday => (
              <BirthdayItem
                key={birthday.id}
                birthday={birthday}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {otherBirthdays.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">🗓️ All Birthdays</h2>
          <div className="space-y-2">
            {otherBirthdays.map(birthday => (
              <BirthdayItem
                key={birthday.id}
                birthday={birthday}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BirthdayList;