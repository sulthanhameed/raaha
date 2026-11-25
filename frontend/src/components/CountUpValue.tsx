import { useCountUp } from "../utils/useCountUp";
import { cn } from "../utils/cn";

type CountUpValueProps = {
  value: number;
  /** Formats the number for display; it receives an already-rounded value. */
  format?: (value: number) => string;
  /** Decimal places kept while counting. Defaults to whole numbers. */
  decimals?: number;
  /** Value the first count starts from; omit to show the final value at once. */
  initial?: number;
  duration?: number;
  className?: string;
  /** Text announced instead of the running number. Defaults to the final value. */
  accessibleText?: string;
};

/**
 * A number that counts to its value. The running digits are hidden from
 * assistive technology and the final figure is announced once beside them, so
 * nobody hears a burst of intermediate amounts. Under reduced motion the final
 * value is shown immediately.
 */
export function CountUpValue({
  value,
  format = (n) => String(n),
  decimals = 0,
  initial,
  duration,
  className,
  accessibleText,
}: CountUpValueProps) {
  const factor = Math.pow(10, Math.max(0, Math.min(6, decimals)));
  const display = useCountUp(value, { initial, duration });
  const shown = format(Math.round(display * factor) / factor);
  const finalText = accessibleText ?? format(Math.round(value * factor) / factor);

  return (
    <>
      <span className={cn("count-value", className)} aria-hidden="true">{shown}</span>
      <span className="sr-only">{finalText}</span>
    </>
  );
}
