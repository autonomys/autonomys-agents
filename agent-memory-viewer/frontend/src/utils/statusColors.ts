import { ResponseStatus } from '../types/enums';

export const getStatusColor = (status: ResponseStatus | null): string => {
  if (!status) return '#00ff00';

  switch (status) {
    case ResponseStatus.APPROVED:
      return 'green.500';
    case ResponseStatus.REJECTED:
      return 'red.500';
    case ResponseStatus.SKIPPED:
      return 'gray.500';
    case ResponseStatus.POSTED:
      return 'purple.500';
    default:
      return '#00ff00';
  }
};
