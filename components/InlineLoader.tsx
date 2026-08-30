type InlineLoaderProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function InlineLoader({ label, className = "", compact = false }: InlineLoaderProps) {
  return (
    <span
      className={`inline-loader${compact ? " inline-loader--compact" : ""}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="inline-loader__spinner" aria-hidden="true" />
      {label ? <span className="inline-loader__label">{label}</span> : <span className="sr-only">Memuat...</span>}
    </span>
  );
}
