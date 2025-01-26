import { HStack, Button, Text } from '@chakra-ui/react';
import { buttonStyles, textStyles } from '../styles';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add numbers with dots
    let l;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <HStack spacing={2}>
      <Button
        onClick={() => onPageChange(1)}
        isDisabled={currentPage === 1}
        {...buttonStyles.primary}
        size="sm"
      >
        First
      </Button>

      {getPageNumbers().map((pageNumber, index) => (
        pageNumber === '...' ? (
          <Text key={`dots-${index}`} {...textStyles.value}>...</Text>
        ) : (
          <Button
            key={pageNumber}
            onClick={() => onPageChange(Number(pageNumber))}
            isDisabled={currentPage === pageNumber}
            {...buttonStyles.primary}
            size="sm"
            variant={currentPage === pageNumber ? 'solid' : 'outline'}
          >
            {pageNumber}
          </Button>
        )
      ))}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        {...buttonStyles.primary}
        size="sm"
      >
        Next
      </Button>

      <Button
        onClick={() => onPageChange(totalPages)}
        isDisabled={currentPage === totalPages}
        {...buttonStyles.primary}
        size="sm"
      >
        Last
      </Button>
    </HStack>
  );
}; 