import { Box } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import MemoryViewer from './pages/MemoryViewer'
import DSNViewer from './components/DSNViewer'
import Analytics from './components/Analytics'

function App() {
    return (
        <Box minH="100vh">
            <Navbar />
            <Box as="main" p={4}>
                <Routes>
                <Analytics />
                    <Route path="/" element={<DSNViewer />} />
                    <Route path="/memory/:cid" element={<MemoryViewer />} />
                </Routes>
            </Box>
        </Box>
    )
}

export default App 