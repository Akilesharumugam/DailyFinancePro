"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  action?: React.ReactNode;
};

export function PasswordField({
  name = "password",
  label = "Password",
  placeholder = "Enter your password",
  autoComplete = "current-password",
  minLength = 8,
  required = true,
  action,
}: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="password-input-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          minLength={minLength}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  );
}
