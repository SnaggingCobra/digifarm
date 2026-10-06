"use client";

import { useState } from "react";
import { Icon } from "../icon";

export function PasswordField({ name, label, newPassword = false }: { name: string; label: string; newPassword?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="password-field">
        <input id={name} name={name} type={visible ? "text" : "password"} autoComplete={newPassword ? "new-password" : "current-password"} minLength={newPassword ? 8 : undefined} maxLength={128} required />
        <button className="password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} title={`${visible ? "Hide" : "Show"} password`}>
          <Icon name={visible ? "eye-off" : "eye"} />
        </button>
      </div>
    </div>
  );
}