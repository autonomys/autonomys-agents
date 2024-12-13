import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { usePendingResponses, useSkippedTweets } from '../api/client'

function Dashboard() {
    const { data: pendingResponses } = usePendingResponses()
    const { data: skippedTweets } = useSkippedTweets()

    return (
        <Box>
            <Text textAlign="center" mb={4} color="yellow.300">
                ⚡️ Welcome to Auto-KOL Dashboard ⚡️
            </Text>
            <Box border="2px solid #c0c0c0" p={4} mb={6}>
                <Heading textAlign="center">
                    &lt;== DASHBOARD ==&gt;
                </Heading>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <RouterLink to="/responses" style={{ textDecoration: 'none' }}>
                    <Stat
                        bg="#c0c0c0"
                        p={4}
                        border="2px outset #ffffff"
                        color="black"
                        cursor="pointer"
                        _hover={{ bg: '#d0d0d0' }}
                    >
                        <StatLabel fontFamily="Monaco, 'Courier New', monospace">
                            &gt; Pending Responses
                        </StatLabel>
                        <StatNumber fontSize="24px" color="navy">
                            {pendingResponses?.length || 0}
                        </StatNumber>
                        <StatHelpText color="maroon">
                            [Awaiting approval]
                        </StatHelpText>
                    </Stat>
                </RouterLink>

                <RouterLink to="/skipped" style={{ textDecoration: 'none' }}>
                    <Stat
                        bg="#c0c0c0"
                        p={4}
                        border="2px outset #ffffff"
                        color="black"
                        cursor="pointer"
                        _hover={{ bg: '#d0d0d0' }}
                    >
                        <StatLabel fontFamily="Monaco, 'Courier New', monospace">
                            &gt; Skipped Tweets
                        </StatLabel>
                        <StatNumber>{skippedTweets?.length || 0}</StatNumber>
                        <StatHelpText>Low engagement probability</StatHelpText>
                    </Stat>
                </RouterLink>

                <Stat bg="#c0c0c0" p={4} border="2px outset #ffffff" color="black">
                    <StatLabel fontFamily="Monaco, 'Courier New', monospace">
                        &gt; Response Rate
                    </StatLabel>
                    <StatNumber>
                        {pendingResponses && skippedTweets
                            ? `${Math.round((pendingResponses.length / (pendingResponses.length + skippedTweets.length)) * 100)}%`
                            : '0%'}
                    </StatNumber>
                    <StatHelpText>Engagement ratio</StatHelpText>
                </Stat>
            </SimpleGrid>
            <Text textAlign="center" mt={6} color="yellow.300">
                ===============================
            </Text>
        </Box>
    )
}

export default Dashboard 