import { useCallback, useMemo, type KeyboardEvent } from 'react'
import type { FieldDescriptor } from 'uibank/core'

/**
 * uibank field primitives (`ub-input`, `ub-checkbox`, …) are form-engine
 * components: they need a `field` descriptor and emit a `ub-input` CustomEvent
 * instead of firing React's onChange. These thin wrappers hand-wire both so the
 * rest of the app can treat them like plain controlled inputs.
 *
 * `field` / `value` are passed as JSX props (React 19 sets them as DOM
 * properties *before* the element's first render — an effect would run too late
 * and the element would render against an undefined `field`). The `ub-input`
 * CustomEvent still needs addEventListener, wired via a callback ref.
 */

type FieldEl = HTMLElement & { field: FieldDescriptor; value: unknown }

/** Attach a one-time `ub-input` listener without leaking on unmount/re-attach. */
function useUbInput(onValue: (v: unknown) => void) {
  return useCallback(
    (el: FieldEl | null) => {
      if (!el) return
      const handler = (e: Event) => onValue((e as CustomEvent).detail.value)
      el.addEventListener('ub-input', handler)
      return () => el.removeEventListener('ub-input', handler)
    },
    [onValue],
  )
}

/** Single-line text field backed by <ub-input>. */
export function TextField({
  value,
  onChange,
  onEnter,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  placeholder?: string
}) {
  const field = useMemo<FieldDescriptor>(
    () => ({ order: 1, type: 'text', key: 'text', placeholder }),
    [placeholder],
  )
  const ref = useUbInput((v) => onChange(v as string))

  return (
    <ub-input
      ref={ref}
      field={field}
      value={value}
      style={{ flex: 1 }}
      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && onEnter?.()}
    />
  )
}

/** Checkbox backed by <ub-checkbox>. */
export function CheckField({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  const field = useMemo<FieldDescriptor>(
    () => ({ order: 1, type: 'checkbox', key: 'done', label }),
    [label],
  )
  const ref = useUbInput((v) => onChange(v as boolean))

  return <ub-checkbox ref={ref} field={field} value={checked} />
}
