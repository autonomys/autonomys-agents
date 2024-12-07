import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react'
import { usePendingResponses, useSkippedTweets } from '../api/client'

function Dashboard() {
    const { data: pendingResponses } = usePendingResponses()
    const { data: skippedTweets } = useSkippedTweets()

    return (
        <Box>
            <Heading mb={6}>Dashboard</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Stat bg="white" p={4} rounded="lg" shadow="sm">
                    <StatLabel>Pending Responses</StatLabel>
                    <StatNumber>{pendingResponses?.length || 0}</StatNumber>
                    <StatHelpText>Awaiting approval</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} rounded="lg" shadow="sm">
                    <StatLabel>Skipped Tweets</StatLabel>
                    <StatNumber>{skippedTweets?.length || 0}</StatNumber>
                    <StatHelpText>Low engagement probability</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} rounded="lg" shadow="sm">
                    <StatLabel>Response Rate</StatLabel>
                    <StatNumber>
                        {pendingResponses && skippedTweets
                            ? `${Math.round((pendingResponses.length / (pendingResponses.length + skippedTweets.length)) * 100)}%`
                            : '0%'}
                    </StatNumber>
                    <StatHelpText>Engagement ratio</StatHelpText>
                </Stat>
            </SimpleGrid>
        </Box>
    )
}

export default Dashboard 