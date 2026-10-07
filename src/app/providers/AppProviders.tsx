import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { PopupProvider } from '@/components/common/Popup'
import { router } from '../router'
import { queryClient } from './queryClient'

/** Bọc mọi Provider ở một chỗ để main.tsx và App.tsx gọn. */
export default function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <PopupProvider>
        <RouterProvider router={router} />
      </PopupProvider>
    </QueryClientProvider>
  )
}
