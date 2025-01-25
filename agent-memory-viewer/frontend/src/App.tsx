import { Box, Flex } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Footer } from './components/Footer'
import MemoryViewer from './pages/MemoryViewer'
import DSNViewer from './pages/DSNViewer'
import Analytics from './components/Analytics'

function App() {
    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            <Analytics />
            <Box as="main" p={4} flex="1">
                <Routes>
                    <Route path="/" element={<DSNViewer />} />
                    <Route path="/memory/:cid" element={<MemoryViewer />} />
                </Routes>
            </Box>
            <Footer />
        </Flex>
    )
}

export default App 