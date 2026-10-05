import { accentGradient } from "../../utils/palette"

type ToggleProps = {
  /** label */
  label: string,
  /** tool tip for what this is toggling */
  hint?: string,
  /** toggle state */
  checked: boolean,
  /** callback for change */
  onChange: (checked: boolean) => void,
}

export default function Toggle({ 
  label, 
  hint, 
  checked, 
  onChange 
}: ToggleProps) {
  return (
    <div 
      className="flex rounded-md border border-line justify-between align-start mb-3.5 px-3.25 py-2.75 gap-3.5">
      <div>
        <span className="type-item block">{label}</span>
        {hint && <span className="type-meta mt-0.5 block">{hint}</span>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative rounded-full ${checked ? `${accentGradient()} border-ink` : "bg-line border-muted"} w-10 h-5 p-0.75 mt-px cursor-pointer`}>
        <span className={`bg-white rounded-full size-4 absolute top-0.5 left-0.5 ${checked ? "translate-x-5" : ""}`}
        style={{ 
          transition: "translate 0.18s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" 
        }} />
      </button>
    </div>
  );
}
