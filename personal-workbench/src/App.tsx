import { useEffect } from 'react'
import { App as AntApp } from 'antd'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { PlaceholderPage } from './features/shared/PlaceholderPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TodayPage } from './features/today/TodayPage'
import { SelfMediaPage } from './features/self-media/SelfMediaPage'
import { DevelopmentPage } from './features/development/DevelopmentPage'
import { ConsultingPage } from './features/consulting/ConsultingPage'
import { FitnessPage } from './features/fitness/FitnessPage'
import { DietPage } from './features/diet/DietPage'
import { GamesPage } from './features/games/GamesPage'
import { DataDesignPage } from './features/data-design/DataDesignPage'
import { LearningPage } from './features/learning/LearningPage'
import { BackupPage } from './features/backup/BackupPage'
import { ErrorBoundary } from './app/ErrorBoundary'
import { navigationItems } from './app/navigation'
import { verifyLocalStorage } from './db/database'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/self-media" element={<SelfMediaPage />} />
        <Route path="/development" element={<DevelopmentPage />} />
        <Route path="/consulting" element={<ConsultingPage />} />
        <Route path="/fitness" element={<FitnessPage />} />
        <Route path="/diet" element={<DietPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/data-design" element={<DataDesignPage />} />
        <Route path="/learning" element={<LearningPage />} />
        {navigationItems
          .filter(
            (item) =>
              ![
                '/',
                '/today',
                '/self-media',
                '/development',
                '/consulting',
                '/fitness',
                '/diet',
                '/games',
                '/data-design',
                '/learning',
              ].includes(item.path),
          )
          .map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={<PlaceholderPage title={item.label} />}
            />
          ))}
        <Route path="/backup" element={<BackupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  useEffect(() => {
    void verifyLocalStorage()
  }, [])

  return (
    <AntApp>
      <ErrorBoundary>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ErrorBoundary>
    </AntApp>
  )
}

export default App
