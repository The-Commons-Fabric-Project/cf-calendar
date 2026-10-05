import { useEffect } from "react";
import type { ReactNode } from "react";
import { accentStops, type ColorVariantKey } from "../../utils/palette";

export type ModalProps = {
  title?: string,
  subtitle?: string,
  children: ReactNode,
  onClose: () => void,
  width?: number,
  accent?: ColorVariantKey
}

/** Modal shell with header and blank contents. */
export default function Modal({ 
  title,
  subtitle,
  children, 
  onClose, 
  width = 500,
  accent = "purple"
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-100 flex items-center justify-center p-5 bg-overlay backdrop-blur-xs animate-fade"
    >
      <div
        role="dialog" aria-modal="true"
        className={`w-[${width}px] max-w-[${width}px] max-h-[88vh] overflow-y-auto bg-white rounded-lg border border-ink animate-pop`}
      >
        <ModalHeader title={title} subtitle={subtitle} onClose={onClose} accent={accent}/>
        {children}
      </div>
    </div>
  );
}

export type ModalHeaderProps = {
  title?: string,
  onClose: () => void,
  subtitle?: string,
  accent?: ColorVariantKey
}

export function CloseButton({ onClose }: {onClose: () => void}) {
  return (
    <button onClick={onClose} aria-label="Close"    
        className="cf-press absolute top-3.5 right-4 w-7 h-7 z-2 rounded-md border border-line bg-surface cursor-pointer text-body text-[15px] leading-none flex items-center justify-center"
    >×</button>
  )
}

export function ModalHeader({ title, onClose, subtitle, accent = "purple" }: ModalHeaderProps) {
  const stops = accentStops(accent);
  return (
    <>
      {/* top edge decoration with gradient stops */}
      <div className='flex gap-0.5'>
        {stops.map((c, i) => (
          <span key={i} className={`flex-1 h-0.75`}
            style={{ background: `var(--color-${c})`}}
          /> 
        ))}
      </div>

      {title && <div className="relative border-b border-line pt-5 px-6 pb-4">
        <CloseButton onClose={onClose}/>
         <h2 
          className="font-bold text-[18px] text-ink m-0 pr-8">{title}</h2>
        {subtitle && 
        <p className="mt-1.5 text-xs text-body font-sans">{subtitle}</p>}
      </div>}
    </>
  );
}
