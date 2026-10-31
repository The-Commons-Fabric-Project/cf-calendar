import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

const SECTIONS = [
  {
    heading: "What this is",
    body: "Commons Fabric is a shared community calendar and directory for the Rideau Community Hub. Organizations sharing space at the Hub can list their events in one place, and neighbours can browse everything happening in one view instead of checking a dozen separate sites.",
  },
  {
    heading: "Why it exists",
    body: "Event details were scattered across flyers, mailing lists, and individual org websites, and it was hard for anyone to get a full picture of what was happening at the Hub. Commons Fabric gives every organization a place to post events and be discovered by the wider community.",
  },
  {
    heading: "Get involved",
    body: "If your organization shares space at the Hub, create an account to start publishing your own events and appear in the directory.",
  },
];

function RouteComponent() {
  return (
    <>
      <div className="w-260 pt-9 px-6 mb-6 mx-auto"
    style={{ animation: 'cf-fade .3s ease' }}>
        <h1>About Commons Fabric</h1>
        <p className="lede">Why we built this, and what it's for.</p>
      </div>

      <div className="flex flex-col gap-4.5 max-w-160 my-0 mx-40 self-start">
        {SECTIONS.map((s) => (
          <div key={s.heading} className='card p-5.5'>
            <h2 className="type-title">{s.heading}</h2>
            <p className="type-body">{s.body}</p>
          </div>
        ))}
      </div>
    </>
  )
}
