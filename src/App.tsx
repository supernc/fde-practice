import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ExamPage from './pages/ExamPage'
import PracticePage from './pages/PracticePage'
import CoursesPage from './pages/CoursesPage'
import ResourcesPage from './pages/ResourcesPage'
import RandomPage from './pages/RandomPage'
import WrongBookPage from './pages/WrongBookPage'
import FavoritesPage from './pages/FavoritesPage'
import DataManagePage from './pages/DataManagePage'
import SettingsPage from './pages/SettingsPage'

const StatsPage = lazy(() => import('./pages/StatsPage'))

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="learn" element={<CoursesPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="random" element={<RandomPage />} />
          <Route path="wrong" element={<WrongBookPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="stats" element={<Suspense fallback={<p role="status">正在加载数据看板…</p>}><StatsPage /></Suspense>} />
          <Route path="data" element={<DataManagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
