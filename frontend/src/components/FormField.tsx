interface FormFieldProps {
  label: string
  type: string
  value: string
  error?: string
  autoComplete?: string
  onChange: (value: string) => void
}

function FormField({ label, type, value, error, autoComplete, onChange }: FormFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

export default FormField
