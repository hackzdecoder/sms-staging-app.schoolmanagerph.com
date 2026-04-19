import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

// ----------------------------------------------------------------------

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);

// ----------------------------------------------------------------------

export type DatePickerFormat = Dayjs | Date | string | number | null | undefined;

export const formatPatterns = {
  dateTime: 'DD MMM YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
};

const isValidDate = (date: DatePickerFormat) =>
  date !== null && date !== undefined && dayjs(date).isValid();

// ----------------------------------------------------------------------

/**
 * @output 17 Apr 2022 12:00 am
 */
export function fDateTime(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.dateTime);
}

// ----------------------------------------------------------------------

/**
 * @output 17 Apr 2022
 */
export function fDate(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.date);
}

// ----------------------------------------------------------------------

/**
 * @output 12:00 am
 */
export function fTime(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.time);
}

// ----------------------------------------------------------------------

/**
 * @output DD/MM/YYYY h:mm a
 */
export function fDateTimeSplit(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.split.dateTime);
}

// ----------------------------------------------------------------------

/**
 * @output DD/MM/YYYY
 */
export function fDateSplit(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.split.date);
}

// ----------------------------------------------------------------------

/**
 * @output DD-MM-YYYY h:mm a
 */
export function fDateTimeParamCase(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.paramCase.dateTime);
}

// ----------------------------------------------------------------------

/**
 * @output DD-MM-YYYY
 */
export function fDateParamCase(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.paramCase.date);
}

// ----------------------------------------------------------------------

/**
 * @output Smart relative time display (like social media apps)
 */
export function fToNow(date: DatePickerFormat): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  const dayjsDate = dayjs(date);
  const now = dayjs();
  const isPast = dayjsDate.isBefore(now);
  
  const diffSeconds = Math.abs(now.diff(dayjsDate, 'second'));
  const diffMinutes = Math.abs(now.diff(dayjsDate, 'minute'));
  const diffHours = Math.abs(now.diff(dayjsDate, 'hour'));
  const diffDays = Math.abs(now.diff(dayjsDate, 'day'));
  const diffWeeks = Math.abs(now.diff(dayjsDate, 'week'));
  const diffMonths = Math.abs(now.diff(dayjsDate, 'month'));
  const diffYears = Math.abs(now.diff(dayjsDate, 'year'));
  
  // Smart thresholds (like social media apps)
  if (diffSeconds < 45) {
    return isPast ? 'a few seconds ago' : 'in a few seconds';
  } else if (diffSeconds < 90) {
    return isPast ? 'a minute ago' : 'in a minute';
  } else if (diffMinutes < 45) {
    const value = diffMinutes;
    return isPast ? `${value} minutes ago` : `in ${value} minutes`;
  } else if (diffMinutes < 90) {
    return isPast ? 'an hour ago' : 'in an hour';
  } else if (diffHours < 24) {
    const value = diffHours;
    return isPast ? `${value} hours ago` : `in ${value} hours`;
  } else if (diffDays < 7) {
    const value = diffDays;
    if (value === 1) return isPast ? 'yesterday' : 'tomorrow';
    return isPast ? `${value} days ago` : `in ${value} days`;
  } else if (diffWeeks < 5) {
    const value = diffWeeks;
    return isPast ? `${value} ${value === 1 ? 'week' : 'weeks'} ago` : `in ${value} ${value === 1 ? 'week' : 'weeks'}`;
  } else if (diffMonths < 12) {
    const value = diffMonths;
    return isPast ? `${value} ${value === 1 ? 'month' : 'months'} ago` : `in ${value} ${value === 1 ? 'month' : 'months'}`;
  } else {
    const value = diffYears;
    return isPast ? `${value} ${value === 1 ? 'year' : 'years'} ago` : `in ${value} ${value === 1 ? 'year' : 'years'}`;
  }
}

/**
 * @output 2 days, 3 hours, 15 minutes
 */
export function fDuration(durationMs: number): string {
  if (!durationMs || durationMs <= 0) {
    return '0 seconds';
  }

  const durationObj = dayjs.duration(durationMs);
  const days = Math.floor(durationObj.asDays());
  const hours = Math.floor(durationObj.asHours() % 24);
  const minutes = Math.floor(durationObj.asMinutes() % 60);
  const seconds = Math.floor(durationObj.asSeconds() % 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 && days === 0 && hours === 0) {
    // Only show seconds if duration is less than a minute
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(', ') || '0 seconds';
}

// ----------------------------------------------------------------------

/**
 * @output Convert to UTC string
 */
export function fToUTC(date: DatePickerFormat): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).utc().format();
}

// ----------------------------------------------------------------------

/**
 * @output Convert from UTC to local time
 */
export function fFromUTC(date: DatePickerFormat): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs.utc(date).local().format(formatPatterns.dateTime);
}

// ----------------------------------------------------------------------

/**
 * @output Check if date is today
 */
export function fIsToday(date: DatePickerFormat): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  return dayjs(date).isSame(dayjs(), 'day');
}

// ----------------------------------------------------------------------

/**
 * @output Check if date is yesterday
 */
export function fIsYesterday(date: DatePickerFormat): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const yesterday = dayjs().subtract(1, 'day');
  return dayjs(date).isSame(yesterday, 'day');
}

// ----------------------------------------------------------------------

/**
 * @output Check if date is tomorrow
 */
export function fIsTomorrow(date: DatePickerFormat): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const tomorrow = dayjs().add(1, 'day');
  return dayjs(date).isSame(tomorrow, 'day');
}

// ----------------------------------------------------------------------

/**
 * @output Add days to date
 */
export function fAddDays(date: DatePickerFormat, days: number): Date {
  if (!isValidDate(date)) {
    return new Date();
  }

  return dayjs(date).add(days, 'day').toDate();
}

// ----------------------------------------------------------------------

/**
 * @output Subtract days from date
 */
export function fSubtractDays(date: DatePickerFormat, days: number): Date {
  if (!isValidDate(date)) {
    return new Date();
  }

  return dayjs(date).subtract(days, 'day').toDate();
}

// ----------------------------------------------------------------------

/**
 * @output Get start of day
 */
export function fStartOfDay(date: DatePickerFormat): Date {
  if (!isValidDate(date)) {
    return new Date();
  }

  return dayjs(date).startOf('day').toDate();
}

// ----------------------------------------------------------------------

/**
 * @output Get end of day
 */
export function fEndOfDay(date: DatePickerFormat): Date {
  if (!isValidDate(date)) {
    return new Date();
  }

  return dayjs(date).endOf('day').toDate();
}