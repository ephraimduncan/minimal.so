import { useEffect, useRef, useCallback, type RefObject } from "react";

interface FieldConfig<T extends string = string> {
  name: T;
  id: string;
}

export function useAutofill<T extends string>(
  setValue: (name: T, value: string) => void,
  fields: readonly FieldConfig<T>[]
): RefObject<HTMLFormElement | null> {
  const formRef = useRef<HTMLFormElement>(null);

  const handleAutofill = useCallback(
    (event: AnimationEvent) => {
      if (event.animationName === "onAutoFillStart") {
        const input = event.target as HTMLInputElement;
        const field = fields.find((f) => f.id === input.id);

        if (field && input.value) {
          setValue(field.name, input.value);
        }
      }
    },
    [setValue, fields]
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

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
