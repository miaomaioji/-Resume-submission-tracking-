import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { TablePage } from '@/features/table/TablePage'
import { KanbanPage } from '@/features/kanban/KanbanPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/table" replace /> },
      { path: 'table', element: <TablePage /> },
      { path: 'kanban', element: <KanbanPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
], {
  future: { v7_relativeSplatPath: true },
})
