import { 
    Card, 
    CardBody, 
    Text, 
    Spinner, 
    VStack, 
    HStack, 
    Select,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useDSNData } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { cardStyles, textStyles, selectStyles } from '../styles';
import { colors } from '../styles/theme/colors';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import StatusFilter from '../components/StatusFilter';
import { ExperienceCard } from '../components/ExperienceCard';
import { Pagination } from '../components/Pagination';

function DSNViewer() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedAgent, setSelectedAgent] = useState<string>('all');
    
    const search = searchParams.get('search') || undefined;
    const author = searchParams.get('author') || undefined;
    
    const { data, isLoading, error } = useDSNData(page, limit, selectedAgent, search, author);
    useWebSocket();

    const handleAgentChange = (newAgent: string) => {
        setSelectedAgent(newAgent);
        setPage(1);
    };

    useEffect(() => {
        setPage(1);
    }, [search, author, selectedAgent]);

    if (isLoading) return <Spinner color={colors.primary} />;
    if (error) return <Text {...textStyles.noData}>Error loading DSN data: {(error as Error).message}</Text>;

    const { totalPages } = data?.pagination || { totalPages: 0 };

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
                            selectedAgent={selectedAgent}
                            onAgentChange={handleAgentChange}
                        />
                    </HStack>
                </CardBody>
            </Card>

            {(!data?.data || data.data.length === 0) ? (
                <Text {...textStyles.noData}>
                    No experiences found for the selected filter
                </Text>
            ) : (
                <AnimatePresence>
                    {data.data.map((item: any, index: any) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                            <ExperienceCard item={item} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {data?.data && data.data.length > 0 && (
                <HStack justify="space-between" mt={4}>
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                    <Select 
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        {...selectStyles.baseStyle}
                        {...selectStyles.paginationWidth}
                        _hover={selectStyles.hoverStyle}
                        sx={{
                            ...selectStyles.dropdownStyle,
                            fontSize: '1.1rem',
                            '& option': {
                                fontSize: '1.1rem'
                            }
                        }}
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