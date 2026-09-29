import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider, useAuth } from './hooks/useAuth'
import { routeTree } from './routeTree.gen'

import './index.css'
import { OverlayProvider, type OverlayState } from './hooks/useOverlayContext'

import type { AuthState } from './api/auth'

/**
 * Server data lives in this cache - see hooks/useOrganizations.ts and useEvents.ts.
 *
 * The defaults are set explicitly because Query's own are tuned for apps that
 * want aggressive freshness: staleTime 0, refetchOnWindowFocus true and three
 * retries. For a community calendar that means refetching every time the user
 * alt-tabs back, and a failed request taking four round trips to report itself.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ref: https://tanstack.com/router/v1/docs/how-to/setup-authentication#1-set-up-router-context

export interface MyRouterContext {
  auth: AuthState,
  overlay: OverlayState,
  queryClient: typeof queryClient;
}

// combines https://tanstack.com/router/v1/docs/how-to/setup-authentication#2-configure-router (step 2) and step 3 because they have separate router.tsx and App.tsx files
const router = createRouter({
  routeTree,
  context: {
    // auth will be passed down from App component
    auth: undefined!,
    overlay: undefined!,
    queryClient
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider 
    router={router} 
    context={{ auth }} 
  />
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OverlayProvider>
          <InnerApp />
        </OverlayProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// also reference Tanstack's example repo for the authenticated app code https://github.com/TanStack/router/blob/main/examples/react/authenticated-routes/src/main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)