import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/* ===== React Query Client ===== */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

/* ===== App Providers ===== */
interface AppProvidersProps {
  children: ReactNode
}

/**
 * Wraps the application with all necessary providers.
 * Add new providers here as needed (e.g., ThemeProvider, AuthProvider).
 */
const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default AppProviders
