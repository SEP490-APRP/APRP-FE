import { createBrowserRouter } from 'react-router'

import { MainLayout } from '@/components/layout'
import { HomePage, LoginPage, NotFoundPage } from '@/pages'
import { ROUTES } from '@/utils/constants'

/**
 * Application router configuration.
 * Uses createBrowserRouter for data-driven routing (React Router v7).
 */
const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
      },
    ],
  },
])

export default router
