/**
 * Auth modals - create account. The one auth flow still backed by mocks/auth.ts, so
 * an account created here exists only in memory and cannot be logged into.
 *
 * TODO: blocked on a missing endpoint. This form asks the user to register their
 * organization, and the API can only attach them to an existing `organizationId`.
 * Offer a dropdown of existing orgs plus an option to add a new one.
 */

import { useState } from "react";
import { EMAIL_RE } from "../../utils/stringcheck";
import Modal, { ModalHeader } from "./Modal";
import Field from "../_controls/Field";
import Button from "../_controls/Button";
import Summary from "../_chips/Summary";

import { useToast } from "../../hooks/useOverlayContext";
import { addUser } from "../../mocks/auth";

type CreateAccountModalProps = {
  onClose: () => void;
}

type CreateAccountFormData = {
  name: string,
  email: string,
  password: string,
  org: string
}

export default function CreateAccountModal({ onClose }: CreateAccountModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateAccountFormData>({ 
    name: "", 
    email: "", 
    password: "",
    org: "",
  });
  const [errors, setErrors] = useState<Partial<CreateAccountFormData>>({});

  const { toast } = useToast();

  const validate = () => {
    const e: Partial<CreateAccountFormData> = {};
    if (!formData.name.trim()) e.name = "Organization name is required.";
    if (!EMAIL_RE.test(formData.email)) e.email = "Enter a valid email address.";
    if (formData.password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  }

  const handleCreate = () => {
    try {
      addUser({
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create account.");
      return;
    }
    toast("Account created — check your email to confirm.");
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Create account" onClose={onClose}
        subtitle={step === 1 ? "Register your organization to publish events." : "Confirm your details."} />
      <form onSubmit={handleSubmit} name="Create account">
        <div className="p-[18px_24px_24px]">
        {step === 1 ? (
          <>
            <Field label="Organization name" error={errors.name}>
              <input className={`w-full px-2.75 py-2.25 rounded-md text-sm font-sans outline-none ${errors.name ? 'border border-red-500' : 'border border-slate-300'} bg-white text-slate-900`} value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ottawa Civic Tech" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className={`w-full px-2.75 py-2.25 rounded-md text-sm font-sans outline-none ${errors.email ? 'border border-red-500' : 'border border-slate-300'} bg-white text-slate-900`} value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@org.example" />
            </Field>
            <Field label="Password" error={errors.password}>
              <input type="password" className={`w-full px-2.75 py-2.25 rounded-md text-sm font-sans outline-none ${errors.password ? 'border border-red-500' : 'border border-slate-300'} bg-white text-slate-900`} value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="At least 6 characters" />
            </Field>
            <Button className="w-full mt-1" onClick={() => { if (validate()) setStep(2); }}>Continue</Button>
          </>
        ) : (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4">
              <Summary label="Organization" value={formData.name} />
              <Summary label="Email" value={formData.email} last />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-3.5">Is this information correct?</p>
            <div className="flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>No, edit</Button>
              <Button className="flex-1" onClick={handleCreate}>Yes, create</Button>
            </div>
          </>
        )}
      </div>
      </form>
    </Modal>
  );
}
