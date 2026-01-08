export interface Birthday {
	id: string;
	name: string;
	date: string; // ISO date format
	notes?: string;
	reminderDays?: number; // Days before to remind
	createdAt: string;
	updatedAt: string;
}

export interface CreateBirthdayDto {
	name: string;
	date: string;
	notes?: string;
	reminderDays?: number;
}

export interface UpdateBirthdayDto {
	name?: string;
	date?: string;
	notes?: string;
	reminderDays?: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface BirthdayWithDaysUntil extends Birthday {
	daysUntil: number;
	isToday: boolean;
	isSoon: boolean; // Within reminder days
}