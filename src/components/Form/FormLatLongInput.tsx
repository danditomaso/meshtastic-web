import type {
  BaseFormBuilderProps,
  GenericFormElementProps,
} from "@components/Form/DynamicForm.tsx";
import { LatLongAlt } from "../UI/LatLongAlt.tsx";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";

export interface LatLongFieldProps<T> extends BaseFormBuilderProps<T> {
  type: "latlong";
  toggleOnChange: (newValue: boolean) => void;
  toggleValue: boolean;
  toggleLabel?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function FormLatLongInput<TFieldValues extends FieldValues>({
  control,
  disabled: formLevelDisabled,
  field: fieldConfig,
}: GenericFormElementProps<TFieldValues, LatLongFieldProps<TFieldValues>>) {
  const baseName = fieldConfig.name as Path<TFieldValues>;

  const switchControllerName = `${String(baseName)}_isEnabled` as Path<
    TFieldValues
  >;
  return (
    <Controller
      name={switchControllerName}
      control={control}
      render={() => (
        <LatLongAlt
          id={baseName}
          control={control as Control<FieldValues>}
          toggleValue={fieldConfig?.toggleValue ?? false}
          toggleLabel={fieldConfig?.toggleLabel ?? ""}
          onToggleChange={fieldConfig.toggleOnChange}
          disabled={formLevelDisabled || fieldConfig.disabled}
          containerClassName={fieldConfig.containerClassName}
          inputClassName={fieldConfig.inputClassName}
          {...fieldConfig.properties}
        />
      )}
    />
  );
}
