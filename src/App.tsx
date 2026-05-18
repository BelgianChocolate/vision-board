import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthPage } from './components/AuthPage'
import { BoardPage } from './components/BoardPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/board" element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
