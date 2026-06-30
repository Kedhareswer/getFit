import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DataProvider } from './state/DataContext'
import { useStore } from './state/store'
import ErrorBoundary from './components/ErrorBoundary'
import { WorkoutPickerProvider } from './components/WorkoutPicker'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import ExerciseDetail from './pages/ExerciseDetail'
import Workouts from './pages/Workouts'
import Builder from './pages/Builder'
import Favorites from './pages/Favorites'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Player from './pages/Player'
import SessionSummary from './pages/SessionSummary'
import NotFound from './pages/NotFound'

export default function App() {
  const theme = useStore((s) => s.settings.theme)
  const reduceMotion = useStore((s) => s.settings.reduceMotion)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion))
  }, [reduceMotion])

  return (
    <ErrorBoundary>
      <DataProvider>
        <WorkoutPickerProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="exercises" element={<Library />} />
            <Route path="exercises/:id" element={<ExerciseDetail />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="workouts/:id" element={<Builder />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="progress" element={<Progress />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="session/:workoutId" element={<Player />} />
          <Route path="session/:workoutId/summary" element={<SessionSummary />} />
        </Routes>
        </WorkoutPickerProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
