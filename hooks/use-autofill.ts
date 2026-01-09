import { useEffect, useRef, useCallback, type RefObject } from "react";
import type { UseFormSetValue, FieldValues, Path } from "react-hook-form";

interface FieldConfig<T extends FieldValues> {
  name: Path<T>;
  id: string;
}

/**
 * Hook to detect and handle browser/password manager autofill
 *
 * Uses CSS animation detection - the most reliable cross-browser method.
 * When browsers autofill an input, they apply :-webkit-autofill pseudo-class,
 * which triggers our CSS animation. We listen for animationstart to detect this.
 *
 * @param setValue - react-hook-form's setValue function
 * @param fields - Array of field configs with name (form field) and id (DOM id)
 * @returns Ref to attach to the form element
 */
export function useAutofill<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  fields: FieldConfig<T>[]
): RefObject<HTMLFormElement | null> {
  const formRef = useRef<HTMLFormElement>(null);

  const handleAutofill = useCallback(
    (event: AnimationEvent) => {
      if (event.animationName === "onAutoFillStart") {
        const input = event.target as HTMLInputElement;
        const field = fields.find((f) => f.id === input.id);

        if (field && input.value) {
          setValue(field.name, input.value as T[Path<T>], {
            shouldValidate: true,
          });
        }
      }
    },
    [setValue, fields]
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Listen for the CSS animation that fires on autofill
    form.addEventListener("animationstart", handleAutofill as EventListener);

    return () => {
      form.removeEventListener(
        "animationstart",
        handleAutofill as EventListener
      );
    };
  }, [handleAutofill]);

  return formRef;
}
