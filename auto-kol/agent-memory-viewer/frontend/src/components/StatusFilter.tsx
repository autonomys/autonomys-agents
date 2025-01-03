import { HStack, Text, Select } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { ResponseStatus } from '../types/enums';
import { textStyles, selectStyles } from '../styles';
import { colors } from '../styles/theme/colors';

interface StatusFilterProps {
    type: ResponseStatus | 'all';
    onTypeChange: (type: ResponseStatus | 'all') => void;
}

function StatusFilter({ type, onTypeChange }: StatusFilterProps) {
    const filterOptions = [
        { value: 'all', label: 'All Tweets' },
        { value: ResponseStatus.POSTED, label: 'Posted' },
        { value: ResponseStatus.SKIPPED, label: 'Skipped' },
        { value: ResponseStatus.APPROVED, label: 'Approved' },
        { value: ResponseStatus.REJECTED, label: 'Rejected' }
    ];

    return (
        <HStack spacing={4} minW="300px">
            <Text {...textStyles.label}>Filter by Status:</Text>
            <Select
                value={type}
                onChange={(e) => onTypeChange(e.target.value as ResponseStatus | 'all')}
                icon={<ChevronDownIcon color={colors.primary} />}
                {...selectStyles.baseStyle}
                {...selectStyles.filterWidth}
                _hover={selectStyles.hoverStyle}
                sx={selectStyles.dropdownStyle}
            >
                {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </HStack>
    );
}

export default StatusFilter; 