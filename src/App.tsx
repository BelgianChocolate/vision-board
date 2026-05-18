import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthPage } from './components/AuthPage'
import { BoardPage } from './components/BoardPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/board" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
