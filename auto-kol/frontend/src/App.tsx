import { Box } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Responses from './pages/Responses'
import SkippedTweets from './pages/SkippedTweets'

function App() {
    return (
        <Box minH="100vh">
            <Navbar />
            <Box as="main" p={4}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/responses" element={<Responses />} />
                    <Route path="/skipped" element={<SkippedTweets />} />
                </Routes>
            </Box>
        </Box>
    )
}

export default App 