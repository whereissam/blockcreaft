import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GamePage } from './pages/GamePage'
import { MarketplacePage } from './pages/MarketplacePage'
import { AdminPage } from './pages/AdminPage'
import { AdminImageGenPage } from './pages/AdminImageGenPage'
import { Web3Provider } from './providers/Web3Provider'

function App() {
  return (
    <Web3Provider>
      <Router>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/generate" element={<AdminImageGenPage />} />
        </Routes>
      </Router>
    </Web3Provider>
  )
}

export default App