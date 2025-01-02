import { 
    Card, 
    CardBody, 
    Text, 
    Spinner, 
    VStack, 
    Link, 
    Button, 
    HStack, 
    Select
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useDSNData } from '../api/client';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { ResponseStatus } from '../types/enums';
import { getStatusColor } from '../utils/statusColors';
import {
    cardStyles,
    textStyles,
    buttonStyles,
    linkStyles,
    selectStyles,
} from '../styles';
import { colors } from '../styles/theme/colors';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import StatusFilter from './StatusFilter';

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
                    No tweets found for the selected filter
                </Text>
            ) : (
                <AnimatePresence>
                    {data.data.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                type: "spring",
                                damping: 20,
                                stiffness: 100,
                                duration: 0.3,
                                delay: index * 0.1
                            }}
                        >
                            <Card {...cardStyles.baseStyle}>
                                <CardBody {...cardStyles.bodyStyle}>
                                    <Text {...textStyles.heading}>
                                        Tweet by @{item.author_username}
                                    </Text>
                                    <Text {...textStyles.value} whiteSpace="pre-wrap" mb={4}>
                                        {item.tweet_content}
                                    </Text>
                                    
                                    {item.result_type === 'skipped' ? (
                                        <>
                                            <Text {...textStyles.label} color="yellow.500" mb={2}>
                                                Skipped: {item.skip_reason}
                                            </Text>
                                            <HStack spacing={4}>
                                                <Link
                                                    as={RouterLink}
                                                    to={`/memory/${item.cid}`}
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View Memory <ExternalLinkIcon mx="2px" />
                                                </Link>
                                                <Link
                                                    href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                                                    isExternal
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View in Explorer <ExternalLinkIcon mx="2px" />
                                                </Link>
                                            </HStack>
                                        </>
                                    ) : item.result_type === 'rejected' ? (
                                        <>
                                            <Text {...textStyles.heading}>Response</Text>
                                            <Text {...textStyles.value} whiteSpace="pre-wrap" mb={4}>
                                                {item.response_content}
                                            </Text>
                                            
                                            <Text 
                                                {...textStyles.label}
                                                color={getStatusColor(ResponseStatus.REJECTED)} 
                                                mb={2}
                                            >
                                                Status: Rejected
                                            </Text>
                                            <HStack spacing={4}>
                                                <Link
                                                    as={RouterLink}
                                                    to={`/memory/${item.cid}`}
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View Memory <ExternalLinkIcon mx="2px" />
                                                </Link>
                                                <Link
                                                    href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                                                    isExternal
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View in Explorer <ExternalLinkIcon mx="2px" />
                                                </Link>
                                            </HStack>
                                        </>
                                    ) : (
                                        <>
                                            <Text {...textStyles.heading}>Response:</Text>
                                            <Text {...textStyles.value} whiteSpace="pre-wrap" mb={4}>
                                                {item.response_content}
                                            </Text>
                                            <Text 
                                                {...textStyles.label}
                                                color={getStatusColor(item.response_status)} 
                                                mb={2}
                                            >
                                                Status: {item.response_status || 'N/A'}
                                            </Text>
                                            <HStack spacing={4}>
                                                <Link
                                                    as={RouterLink}
                                                    to={`/memory/${item.cid}`}
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View Memory <ExternalLinkIcon mx="2px" />
                                                </Link>
                                                <Link
                                                    href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                                                    isExternal
                                                    {...linkStyles.baseStyle}
                                                >
                                                    View in Explorer <ExternalLinkIcon mx="2px" />
                                                </Link>
                                            </HStack>
                                        </>
                                    )}
                                </CardBody>
                            </Card>
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