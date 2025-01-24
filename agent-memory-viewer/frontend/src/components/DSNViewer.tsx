import { 
    Card, 
    CardBody, 
    Text, 
    Spinner, 
    VStack, 
    Button, 
    HStack, 
    Select,
    Tooltip,
    Box,
    Badge,
    IconButton,
} from '@chakra-ui/react';
import ReactJson from 'react-json-view';
import { useState, useEffect } from 'react';
import { useDSNData } from '../api/client';
import { ExternalLinkIcon, CopyIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { ResponseStatus } from '../types/enums';
import {
    cardStyles,
    textStyles,
    buttonStyles,
    selectStyles,
} from '../styles';
import { colors } from '../styles/theme/colors';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import StatusFilter from './StatusFilter';
import { utcToLocalRelativeTime } from '../utils/timeUtils';

function DSNViewer() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [type, setType] = useState<ResponseStatus | 'all'>('all');
    
    const search = searchParams.get('search') || undefined;
    const author = searchParams.get('author') || undefined;
    
    const { data, isLoading, error } = useDSNData(page, limit, type, search, author);
    useWebSocket();

    const handleTypeChange = (newType: ResponseStatus | 'all') => {
        setType(newType);
        setPage(1);
    };

    // Reset page when search/author/type changes
    useEffect(() => {
        setPage(1);
    }, [search, author, type]);

    if (isLoading) return <Spinner color={colors.primary} />;
    if (error) return <Text {...textStyles.noData}>Error loading DSN data: {(error as Error).message}</Text>;

    const { totalPages } = data?.pagination || { totalPages: 0 };

    const renderMemoryCard = (item: any) => (
        <Card 
            {...cardStyles.baseStyle}
            borderLeft="4px solid"
            borderLeftColor={getTypeColor(item.content.type)}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
        >
            <CardBody {...cardStyles.bodyStyle}>
                {/* Header with Metadata */}
                <HStack justify="space-between" mb={4}>
                    <VStack align="start" spacing={1}>
                        <HStack>
                            <Text {...textStyles.heading}>
                                Memory #{item.id}
                            </Text>
                            <Badge 
                                colorScheme={getTypeColorScheme(item.content.type)}
                                fontSize="xs"
                            >
                                LABEL
                            </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                            CID: {item.cid.substring(0, 8)}...
                        </Text>
                    </VStack>
                    <Tooltip 
                        label={new Date(item.timestamp).toLocaleString()} 
                        placement="top"
                    >
                        <VStack spacing={0} align="end">
                            <Text 
                                color="gray.500" 
                                fontSize="sm"
                                cursor="help"
                            >
                                {utcToLocalRelativeTime(item.timestamp)}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                                v{item.content.agentVersion || 'unknown'}
                            </Text>
                        </VStack>
                    </Tooltip>
                </HStack>

                {/* JSON Viewer */}
                <Box 
                    mb={4} 
                    borderRadius="lg"
                    overflow="hidden"
                    bg="blackAlpha.400"
                    p={4}
                    position="relative"
                >
                    <ReactJson 
                        src={item.content}
                        theme="tomorrow"
                        collapsed={1}
                        displayDataTypes={false}
                        name={false}
                        style={{
                            backgroundColor: 'transparent',
                            borderRadius: '0.5rem',
                            fontSize: '0.9em',
                        }}
                        enableClipboard={false}
                        displayObjectSize={false}
                    />
                    <IconButton
                        aria-label="Copy"
                        icon={<CopyIcon />}
                        size="sm"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={() => copyToClipboard(JSON.stringify(item.content, null, 2))}
                    />
                </Box>

                {/* Actions */}
                <HStack spacing={4} justify="flex-end">
                    <Button
                        leftIcon={<ExternalLinkIcon />}
                        as={RouterLink}
                        to={`/memory/${item.cid}`}
                        variant="outline"
                        size="sm"
                        color="green.400"
                        borderColor="green.400"
                        _hover={{
                            bg: 'green.400',
                            color: 'black',
                            borderColor: 'green.400'
                        }}
                    >
                        View Details
                    </Button>
                    <Button
                        leftIcon={<ViewIcon />}
                        as="a"
                        href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                        target="_blank"
                        variant="outline"
                        size="sm"
                        color="green.400"
                        borderColor="green.400"
                        _hover={{
                            bg: 'green.400',
                            color: 'black',
                            borderColor: 'green.400'
                        }}
                    >
                        Explorer
                    </Button>
                </HStack>
            </CardBody>
        </Card>
    );

    return (
        <VStack spacing={4} align="stretch">
            <Card {...cardStyles.baseStyle}>
                <CardBody {...cardStyles.bodyStyle}>
                    <HStack spacing={4} justify="space-between" align="center">
                        <SearchBar 
                            setSearchParams={setSearchParams}
                            defaultValue={searchParams.get('search') || searchParams.get('author') ? `@${searchParams.get('author')}` : ''}
                        />
                        <StatusFilter 
                            type={type}
                            onTypeChange={handleTypeChange}
                        />
                    </HStack>
                </CardBody>
            </Card>

            {(!data?.data || data.data.length === 0) ? (
                <Text {...textStyles.noData}>
                    No memories found for the selected filter
                </Text>
            ) : (
                <AnimatePresence>
                    {data.data.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                            {renderMemoryCard(item)}
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {data?.data && data.data.length > 0 && (
                <HStack justify="space-between" mt={4}>
                    <HStack spacing={4}>
                        <Button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            isDisabled={page === 1}
                            {...buttonStyles.primary}
                        >
                            Previous
                        </Button>
                        <Text {...textStyles.value}>
                            Page {page} of {totalPages}
                        </Text>
                        <Button 
                            onClick={() => setPage(p => p + 1)}
                            isDisabled={page >= totalPages}
                            {...buttonStyles.primary}
                        >
                            Next
                        </Button>
                    </HStack>
                    <Select 
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        {...selectStyles.baseStyle}
                        {...selectStyles.paginationWidth}
                        _hover={selectStyles.hoverStyle}
                        sx={selectStyles.dropdownStyle}
                    >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                    </Select>
                </HStack>
            )}
        </VStack>
    );
}

export default DSNViewer;

// Helper functions
const getTypeColor = (type: string) => {
    switch (type) {
        case 'approved':
        case 'response':
            return 'green.400';
        case 'rejected':
            return 'red.400';
        case 'skipped':
            return 'yellow.400';
        case 'posted':
            return 'blue.400';
        default:
            return 'gray.400';
    }
};

const getTypeColorScheme = (type: string | undefined): string => {
    // Hash the type string to generate consistent colors
    if (!type) return 'gray';
    
    const colorSchemes = [
        'teal', 'blue', 'cyan', 'purple', 'pink', 
        'orange', 'yellow', 'green', 'red'
    ];
    
    // Generate a simple hash of the type string
    const hash = type.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Use the hash to select a color scheme
    const index = Math.abs(hash) % colorSchemes.length;
    return colorSchemes[index];
};

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast notification here
}; 