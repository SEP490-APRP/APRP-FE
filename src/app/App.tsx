import { RouterProvider } from 'react-router'

import AppProviders from './providers/AppProviders'
import router from './router'

/**
 * Root application component.
 * Wraps everything with providers and renders the router.
 */
const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
