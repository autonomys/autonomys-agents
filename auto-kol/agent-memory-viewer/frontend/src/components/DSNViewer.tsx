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
import { useState } from 'react';
import { useDSNData } from '../api/client';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';

function DSNViewer() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [type, setType] = useState<'all' | 'skipped' | 'response'>('all');
    const { data, isLoading, error } = useDSNData(page, limit, type);
    useWebSocket();

    const handleTypeChange = (newType: 'all' | 'skipped' | 'response') => {
        setType(newType);
        setPage(1); // Reset to first page when changing filter
    };

    if (isLoading) return <Spinner color="#00ff00" />;
    if (error) return <Text color="red.500">Error loading DSN data: {(error as Error).message}</Text>;
    if (!data || !data.data || data.data.length === 0) return <Text>No DSN data found</Text>;

    const { totalPages } = data.pagination;

    return (
        <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
                <Select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as typeof type)}
                    width="200px"
                    color="#00ff00"
                    borderColor="#00ff00"
                >
                    <option value="all">All Tweets</option>
                    <option value="skipped">Skipped Only</option>
                    <option value="response">Responses Only</option>
                </Select>
            </HStack>

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
                        <Card>
                            <CardBody>
                                <Text fontSize="sm" color="#00ff00" mb={2}>
                                    Tweet by @{item.author_username}
                                </Text>
                                <Text whiteSpace="pre-wrap" mb={4}>
                                    {item.tweet_content}
                                </Text>
                                
                                {item.result_type === 'skipped' ? (
                                    <>
                                        <Text fontSize="sm" color="yellow.500" mb={2}>
                                            Skipped: {item.skip_reason}
                                        </Text>
                                        <HStack spacing={4}>
                                            <Link
                                                as={RouterLink}
                                                to={`/memory/${item.cid}`}
                                                color="#00ff00"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                            >
                                                View Memory <ExternalLinkIcon mx="2px" />
                                            </Link>
                                            <Link
                                                href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                                                isExternal
                                                color="#00ff00"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                            >
                                                View in Explorer <ExternalLinkIcon mx="2px" />
                                            </Link>
                                        </HStack>
                                    </>
                                ) : (
                                    <>
                                        <Text fontSize="sm" color="#00ff00" mb={2}>
                                            Response:
                                        </Text>
                                        <Text whiteSpace="pre-wrap" mb={4}>
                                            {item.response_content}
                                        </Text>
                                        <Text fontSize="sm" color={item.response_status === 'pending' ? 'yellow.500' : '#00ff00'} mb={2}>
                                            Status: {item.response_status}
                                        </Text>
                                        <HStack spacing={4}>
                                            <Link
                                                as={RouterLink}
                                                to={`/memory/${item.cid}`}
                                                color="#00ff00"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                            >
                                                View Memory <ExternalLinkIcon mx="2px" />
                                            </Link>
                                            <Link
                                                href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
                                                isExternal
                                                color="#00ff00"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
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

            <HStack justify="space-between" mt={4}>
                <HStack spacing={4}>
                    <Button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        isDisabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Text>
                        Page {page} of {totalPages}
                    </Text>
                    <Button 
                        onClick={() => setPage(p => p + 1)}
                        isDisabled={page >= totalPages}
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
                    width="auto"
                    color="#00ff00"
                    borderColor="#00ff00"
                >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                </Select>
            </HStack>
        </VStack>
    );
}

export default DSNViewer; 