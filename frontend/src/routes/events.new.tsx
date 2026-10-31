import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'

import CreateEventModal from '../components/modals/CreateEventModal'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/events/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (!user) return <Navigate to=".." />;

  const closeModal = () => navigate({ to: '..'});
  return <CreateEventModal onClose={closeModal} session={user}/>
}
