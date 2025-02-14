import { HStack, Text, Select } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { textStyles, selectStyles } from '../styles';
import { colors } from '../styles/theme/colors';
import { useAgents } from '../api/client';

interface StatusFilterProps {
    selectedAgent: string;
    onAgentChange: (agent: string) => void;
}

function StatusFilter({ selectedAgent, onAgentChange }: StatusFilterProps) {
    const { data: agents, isLoading } = useAgents();

    const agentOptions = [
        { value: 'all', label: 'All Agents' },
        ...(agents?.map(agent => ({
            value: agent.username,
            label: agent.username
        })) || [])
    ];

    return (
        <HStack spacing={4} minW="300px">
            <Text {...textStyles.label}>Filter by Agent:</Text>
            <Select
                value={selectedAgent}
                onChange={(e) => onAgentChange(e.target.value)}
                icon={<ChevronDownIcon color={colors.primary} />}
                isDisabled={isLoading}
                {...selectStyles.baseStyle}
                {...selectStyles.filterWidth}
                _hover={selectStyles.hoverStyle}
                sx={selectStyles.dropdownStyle}
            >
                {agentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </HStack>
    );
}

export default StatusFilter; 