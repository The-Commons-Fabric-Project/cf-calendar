import { createFileRoute, useNavigate } from '@tanstack/react-router'

import CreateEventModal from '../components/modals/CreateEventModal'
import type { User } from '../api/auth';

export const Route = createFileRoute('/events/new')({
  component: RouteComponent,
  loader: ({ context }) => {
    const { auth } = context;
    const session = auth.user as User;
    return { session };
  }
})

function RouteComponent() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();

  const closeModal = () => navigate({ to: '..'});
  return <CreateEventModal onClose={closeModal} session={session}/>
}
