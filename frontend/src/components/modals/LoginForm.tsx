import { useState } from "react";
import Button from "../_controls/Button";
import Field from "../_controls/Field";
import type { TextInputVariant as InputVariant } from "../../utils/types/variants";
import type { ModalHeaderProps } from "./Modal";

import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useOverlayContext";
import type { AuthAttemptStatus } from "../../api/auth";

function inputStyle (err: boolean): InputVariant {
  return `${err ? "error" : "default"}`;
}

/**
 * Separate from the modal so /login can be navigated to directly.
 *
 * TODO: probably three separate forms; changing credentials may belong in a user
 * profile instead.
 */
export type LoginFormHeader = Pick<ModalHeaderProps, "title" | "subtitle">;

type LoginFormProps = {
  onClose: () => void,
  onChangeMode: (header: LoginFormHeader) => void,
}

export default function LoginForm({
  onClose,
}: LoginFormProps) {
  // context
  const { toast } = useToast();
  const auth = useAuth(); 
  const { status } = auth;

  // state
  const [prevStatus, setPrevStatus] = useState(status);
  
  /** @state login form data */
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  // event handlers and effects
  const handleSubmit = (e: React.SubmitEvent) => {
    handleStatus('pending');
    e.preventDefault();
    // login rejects on a bad password so callers can react to it; this one reads
    // the outcome off `status` in the effect below, so the rejection is expected
    // and swallowed here. Without the catch it surfaces as an unhandled rejection.
    void auth.login(creds.email, creds.password).catch(() => {});
  }

  const handleStatus = (s: AuthAttemptStatus) => {
    switch (s) {
      case 'success': {
        // FIXME: calling toast causes error "Cannot update a component (`OverlayProvider`) while rendering a different component (`LoginForm`). To locate the bad setState() call inside `LoginForm`, follow the stack trace as described in https://react.dev/link/setstate-in-render"
        toast(`Welcome back, ${auth.user?.fullname}`);
        onClose();
        return;
      } case 'fail': {
        // The API's own wording - "Email or password is incorrect." - rather than
        // a generic string, so a server that is down reads differently from a
        // password that is wrong.
        setErr(auth.error || "Authentication failed: error unknown");
        return;
      } case 'pending': {
        setErr("Logging in...");
        return;
      }
    }
    setPrevStatus(s);
  }

  if (status !== prevStatus) handleStatus(status);

  const baseInputStyles = "px-3 py-2 border border-line rounded-md w-full";

  return (
    <form onSubmit={handleSubmit} className="py-2 px-6">
      {/* A seeded account from backend/prisma/seed/dev-organizations-seed.json - these
          are real credentials against a seeded dev database, not a mock. Run
          `npm run db:seed -w backend` if they do not work. */}
      <div className="bg-accent-soft text-ink rounded-md text-xs font-normal tracking-[0.8px] px-3 py-2 mb-4">
        Demo hint: use <strong>jordan.lefebvre@ottawacivictech.example</strong> / <strong>devpassword123</strong>
      </div>
      <Field label="Email" error={err ? " " : ""}>
        <input className={`${baseInputStyles} ${inputStyle(!!err)}`}
          value={creds.email}
          onChange={(e) => { setCreds({ ...creds, email: e.target.value }); setErr(""); }} placeholder="you@org.example" />
      </Field>
      <Field label="Password" error={err}>
        <input type="password" className={`${baseInputStyles} ${inputStyle(!!err)}`} value={creds.password}
          onChange={(e) => { setCreds({ ...creds, password: e.target.value }); setErr(""); }} placeholder="Your password" />
      </Field>
      <Button type="submit" onClick={() => {}} label="Log in"/>
      
    </form>
  );
}