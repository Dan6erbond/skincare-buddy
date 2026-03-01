import { Button, DatePicker, NumberInput, Select, SelectItem } from "@heroui/react";
import { Controller, useFormContext } from "react-hook-form";

import { Trash2 } from "lucide-react";
import { UnitsPeriodAfterOpeningUnit } from "@/lib/appwrite/appwrite";

interface UnitFormFieldsProps {
  index?: number; // Optional index
  onRemove?: () => void;
}

export function UnitFormFields({ index, onRemove }: UnitFormFieldsProps) {
  const { control } = useFormContext();

  // Helper to determine the field name based on whether an index exists
  const getFieldName = (fieldName: string) =>
    index !== undefined ? `units.${index}.${fieldName}` : fieldName;

  return (
    <div className="p-4 rounded-xl border-1 border-default-200 bg-default-50 flex flex-col gap-4 relative">
      {onRemove && (
        <Button
          isIconOnly
          size="sm"
          color="danger"
          variant="light"
          className="absolute top-2 right-2 z-10"
          onPress={onRemove}
        >
          <Trash2 size={16} />
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Controller
          name={getFieldName("purchaseDate")}
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              label="Purchase Date"
              size="sm"
              variant="flat"
            />
          )}
        />
        <Controller
          name={getFieldName("expiresAt")}
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              label="Expiry Date"
              size="sm"
              variant="flat"
            />
          )}
        />
      </div>

      <PAOInputs getName={getFieldName} variant="flat" />
    </div>
  );
}

interface PAOInputsProps {
  // Pass a function to resolve the name, e.g., (name) => `units.${index}.${name}`
  getName: (name: string) => string;
  variant?: "flat" | "bordered" | "faded" | "underlined";
}

export function PAOInputs({ getName, variant = "flat" }: PAOInputsProps) {
  const { control } = useFormContext();

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Controller
          name={getName("periodAfterOpeningDuration")}
          control={control}
          render={({ field }) => (
            <NumberInput
              label="PAO Duration"
              size="sm"
              variant={variant}
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            />
          )}
        />
      </div>
      <Controller
        name={getName("periodAfterOpeningUnit")}
        control={control}
        render={({ field }) => (
          <Select
            label="Unit"
            size="sm"
            className="w-32"
            variant={variant}
            selectedKeys={field.value ? [field.value] : []}
            onSelectionChange={(k) => field.onChange(Array.from(k)[0])}
          >
            <SelectItem key={UnitsPeriodAfterOpeningUnit.MONTHS}>
              Months
            </SelectItem>
            <SelectItem key={UnitsPeriodAfterOpeningUnit.YEARS}>
              Years
            </SelectItem>
          </Select>
        )}
      />
    </div>
  );
}
