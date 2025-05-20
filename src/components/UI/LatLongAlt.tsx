import type React from "react";
import { Label } from "./Label.tsx";
import { Input } from "./Input.tsx";
import { Switch } from "./Switch.tsx";
import { isAllowedNumericInput } from "../../validation/validate.ts";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";

export type PositionKeys = "latitude" | "longitude" | "altitude";

export interface LatLongInputProps {
  id: Path<FieldValues>;
  control: Control<FieldValues>;

  toggleValue: boolean;
  toggleLabel?: string;
  onToggleChange: (newSwitchValue: boolean) => void;

  containerClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function LatLongAlt({
  id: idAndBaseName,
  control,
  toggleValue,
  toggleLabel,
  onToggleChange,
  containerClassName,
  inputClassName,
  disabled,
}: LatLongInputProps) {
  const handleInternalSwitchChange = (newCheckedState: boolean) => {
    onToggleChange(newCheckedState);
  };

  const restrictNumericInput = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      !isAllowedNumericInput(event, { allowDecimal: true, allowNegative: true })
    ) {
      event.preventDefault();
    }
  };

  const commonUiInputStyles =
    `shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
      inputClassName || ""
    }`;
  const errorUiInputStyles =
    "border-red-500 focus:ring-red-500 focus:border-red-500";
  const labelDisabledStyles = disabled
    ? "text-gray-400 cursor-not-allowed"
    : "";

  const latFieldName = `${String(idAndBaseName)}.latitude` as Path<FieldValues>;
  const lonFieldName = `${String(idAndBaseName)}.longitude` as Path<
    FieldValues
  >;
  const altFieldName = `${String(idAndBaseName)}.altitude` as Path<FieldValues>;

  // Updated handleInputOnChange:
  // It now expects react-hook-form's field.onChange to handle a string value.
  // This means react-hook-form will store the input's value as a string.
  const handleInputOnChange = (onChange: (value: string) => void) => // field.onChange from RHF, now typed to accept string
  (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value); // Pass the raw string value to react-hook-form
  };

  return (
    <fieldset
      className={`w-full space-y-3 ${containerClassName || ""}`}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3 p-2 rounded-md">
        <Switch
          checked={toggleValue}
          onCheckedChange={handleInternalSwitchChange}
          id={`${String(idAndBaseName)}-switchToggle`}
          disabled={disabled}
        />
        <Label
          htmlFor={`${String(idAndBaseName)}-switchToggle`}
          className={labelDisabledStyles}
        >
          {toggleLabel ?? ""}
        </Label>
      </div>

      {toggleValue && (
        <div className="flex flex-col sm:flex-row grow gap-2 sm:gap-3">
          <div className="grow space-y-1">
            <Label htmlFor={latFieldName} className={labelDisabledStyles}>
              Latitude
            </Label>
            <Controller
              name={latFieldName}
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    type="text"
                    id={latFieldName}
                    {...field}
                    value={field.value ?? ""}
                    onChange={handleInputOnChange(
                      field.onChange as (value: string) => void,
                    )}
                    onKeyDown={restrictNumericInput}
                    className={`${commonUiInputStyles} ${
                      fieldState.error ? errorUiInputStyles : ""
                    }`}
                    aria-invalid={!!fieldState.error}
                    aria-describedby={fieldState.error
                      ? `${latFieldName}-error`
                      : undefined}
                  />
                  {fieldState.error && (
                    <p
                      id={`${latFieldName}-error`}
                      className="mt-1 text-xs text-red-600 inline-block"
                    >
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Longitude */}
          <div className="grow space-y-1">
            <Label htmlFor={lonFieldName} className={labelDisabledStyles}>
              Longitude
            </Label>
            <Controller
              name={lonFieldName}
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    type="text"
                    id={lonFieldName}
                    {...field}
                    value={field.value ?? ""}
                    onChange={handleInputOnChange(
                      field.onChange as (value: string) => void,
                    )}
                    onKeyDown={restrictNumericInput}
                    className={`${commonUiInputStyles} ${
                      fieldState.error ? errorUiInputStyles : ""
                    }`}
                    aria-invalid={!!fieldState.error}
                    aria-describedby={fieldState.error
                      ? `${lonFieldName}-error`
                      : undefined}
                  />
                  {fieldState.error && (
                    <p
                      id={`${lonFieldName}-error`}
                      className="mt-1 text-xs text-red-600"
                    >
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Altitude */}
          <div className="grow space-y-1">
            <Label htmlFor={altFieldName} className={labelDisabledStyles}>
              Altitude (meters)
            </Label>
            <Controller
              name={altFieldName}
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    type="text"
                    id={altFieldName}
                    {...field}
                    value={field.value ?? ""}
                    onChange={handleInputOnChange(
                      field.onChange as (value: string) => void,
                    )}
                    onKeyDown={restrictNumericInput}
                    className={`${commonUiInputStyles} ${
                      fieldState.error ? errorUiInputStyles : ""
                    }`}
                    aria-invalid={!!fieldState.error}
                    aria-describedby={fieldState.error
                      ? `${altFieldName}-error`
                      : undefined}
                  />
                  {fieldState.error && (
                    <p
                      id={`${altFieldName}-error`}
                      className="mt-1 text-xs text-red-600"
                    >
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
