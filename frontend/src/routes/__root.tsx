import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { MyRouterContext } from '../main'
import Header from '../components/nav/Header'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  // loader: ({context}) => context.auth
})

function RootComponent() {
  return (
    <div className="flex flex-col min-h-100vh items-center">
      <Header /> 
      <Outlet />
    </div>
  )
}