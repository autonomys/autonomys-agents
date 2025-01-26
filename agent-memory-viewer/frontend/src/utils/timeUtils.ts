import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const formatSeconds = (seconds: number | bigint): string => {
  if (typeof seconds === 'number' && seconds < 0) {
    throw new Error('Seconds cannot be negative');
  } else if (typeof seconds === 'bigint' && seconds < 0n) {
    throw new Error('Seconds cannot be negative');
  }

  const timeUnits = [
    { unit: 'd', value: 86400n },
    { unit: 'h', value: 3600n },
    { unit: 'm', value: 60n },
    { unit: 's', value: 1n },
  ];

  let secondsBigInt = BigInt(seconds);

  return (
    timeUnits
      .reduce((result, { unit, value }) => {
        if (secondsBigInt >= value) {
          const time = secondsBigInt / value;
          secondsBigInt %= value;
          result += `${time}${unit} `;
        }
        return result;
      }, '')
      .trim() || '0s'
  );
};

export const utcToLocalRelativeTime = (timestamp: string): string => {
  const now = dayjs();
  const time = dayjs.utc(timestamp).local();
  const diffInSeconds = now.diff(time, 'second');

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  return time.fromNow(true) + ' ago';
};

export const utcToLocalTime = (timestamp: string): string =>
  dayjs.utc(timestamp).local().format('DD MMM YYYY | HH:mm:ss(Z)');

export const currentYear = (): number => dayjs().year();
