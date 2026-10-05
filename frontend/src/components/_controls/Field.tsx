import type { ReactNode } from "react";

type FieldProps = {
  /** label for the form field */
  label: string,
  /** if the label appears next to the input (true) or above (false) */
  inline?: boolean,
  /** error message to display */
  error?: string,
  /** children elements, needs some kind of input HTML element */
  children: ReactNode | ReactNode[] | string,
  /** classes to pass to the outer div */
  className?: string,
}

/** text input field used in forms, e.g. login username and password */
export default function Field({ 
  label, 
  inline = false,
  error, 
  children,
  className,
}: FieldProps) {
  return (
    <label className={`${inline ? "": "block"} items-center mb-3.5 ${className ?? ''}`}>
      <span className={`${inline ? "col-1 w-11" : "block mb-1.5"} type-label`}>{label}</span>
      {children}
      {error && <span className="text-danger font-medium text-xs">{error}</span>}
    </label>
  );
}