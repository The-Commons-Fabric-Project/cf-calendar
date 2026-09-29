import { useState } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'

import type { Org } from '../api/organizations'
import { useOrganizations } from '../hooks/useOrganizations'

import OrgCard from '../components/cards/OrgCard'

export const Route = createFileRoute('/directory')({
  component: Directory,
})

function Directory() {
  const [activeOrg, setActiveOrg] = useState<Org | null>(null)

  // Served from the query cache after the first route that asks for it, so
  // arriving here from the events page costs no request.
  const { data: orgs, isLoading, error } = useOrganizations()
  const navigate = useNavigate({from: '/directory'});

  const openProfile = (org: Org) => {
    setActiveOrg(org);
    window.scrollTo(0, 0);
    navigate({to: '/directory/$orgId', params: { orgId: org.id.toString()}})
  }

  const closeProfile = () => {
    setActiveOrg(null);
    window.scrollTo(0, 0);
    navigate({to: '/directory'});
  }

  return (
    <div className="w-260 pt-9 px-6 pb-20">
      {activeOrg ? (
        <div style={{ animation: 'cf-fade .3s ease' }}>
          <button
            className="bg-transparent border-0 text-primary font-semibold text-[14px] cursor-pointer p-0 mb-4.5 block font-body"
            style={{ transition: 'color .15s ease' }}
            onClick={closeProfile}
          >
            ‹ Back to directory
          </button>
          <Outlet/>
        </div>
        //<ProfileView
        //   org={activeOrg}
        //   onBack={closeProfile}
        //   onSelectEvent={setSelectedEvent}
        // />*/}
      ) : (
        <>
          <h1>Organizations on the Hub</h1>
          <p className="lede">
            Browse member organizations of the Rideau Community Hub network.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            {error ? (
              <div className="text-muted">Could not load organizations. {error.message}</div>
            ) : isLoading ? (
              <div className="text-muted">Loading organizations…</div>
            ) : (
              (orgs ?? []).map((org, i) => (
                // <Link 
                //   to={`/directory/$orgId`} 
                //   params={{ orgId: org.id.toString()}}
                // >
                  <OrgCard key={org.id} org={org} idx={i} onClick={() => openProfile(org)} />
              ))
            )}
          </div>
        </>
      )}

     
    </div>
  )
}
