"use client";
import { useId } from "react";

/**
 * A single-value "creatable select": a text input backed by a <datalist>,
 * so the user can pick a known option or type a brand-new one.
 */
export function CreatableSelect({
  name,
  value,
  onChange,
  options,
  disabled,
  placeholder,
  required,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const listId = useId();
  return (
    <>
      <input
        name={name}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="input"
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
