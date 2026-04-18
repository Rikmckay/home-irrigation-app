import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Nav from './components/Nav'
import MapView from './pages/MapView'
import Controllers from './pages/Controllers'
import ValveBoxes from './pages/ValveBoxes'
import ConnectionBoxes from './pages/ConnectionBoxes'
import Valves from './pages/Valves'
import WateringHeads from './pages/WateringHeads'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        {/* pb-16 on mobile reserves space above the fixed bottom tab bar */}
        <div className="flex flex-col h-screen bg-gray-50">
          <Nav />
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<MapView />} />
              <Route path="/controllers" element={<Controllers />} />
              <Route path="/valve-boxes" element={<ValveBoxes />} />
              <Route path="/connection-boxes" element={<ConnectionBoxes />} />
              <Route path="/valves" element={<Valves />} />
              <Route path="/watering-heads" element={<WateringHeads />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}
