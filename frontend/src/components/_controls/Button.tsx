import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonVariant } from "../../utils/types/variants";
import { accentGradient } from "../../utils/palette";

// reference: https://blog.logrocket.com/building-reusable-react-components-using-tailwind-css/#testing-badge-component
const VARIANT_MAPS: Record<ButtonVariant, string> = {
  primary: `${accentGradient()} text-white text-xs border-none`,
  secondary: "bg-surface text-ink border border-ink text-[11px]",
  tertiary: "bg-surface text-body border border-line text-[11px]",
  disabled: "bg-surface-alt text-faint border border-line text-[11px]",
  // link: "bg-transparent text-muted underline"
}

type ButtonProps = Partial<ButtonHTMLAttributes<HTMLButtonElement>> & {
  /** Variations on button styling */
  variant?: ButtonVariant;
  /** Label for the button, used for accessibility and default display text unless otherwise specified */
  label?: string;
  /** what do when button */
  onClick: () => void;
  /** child elements; for a button, usually just the display text */
  children?: ReactNode | ReactNode[] | string;
  /** additional Tailwind classes to pass to button element*/
  className?: string;
};

/** Generic button component */
export default function Button({ 
  variant = "primary",
  label,
  onClick,
  children,
  className,
  ...props
 }: ButtonProps) {
  const baseClasses = "font-sans font-semibold text-sm py-2.25 px-4.5 rounded-md cursor-pointer leading-tight uppercase";
  const classes = `${baseClasses} ${VARIANT_MAPS[variant]} ${className || ''}`
  const text = label ? label : children?.toString() as string;
  return (
    <button 
      aria-label={text}
      onClick={onClick}
      className={`${classes} cf-press`}
      {...props}
    >
      { label ? label :
      (typeof children === "string") ? (text) : children }
    </button>
  );
}