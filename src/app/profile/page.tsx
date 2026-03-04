"use client";

import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Input,
  Select,
  SelectItem,
  Skeleton,
} from "@heroui/react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  ListChecks,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { ProfileFormValues, ProfileSchema } from "@/lib/schema/profile";

import { ProfilesSkinType } from "@/lib/appwrite/appwrite";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { zodResolver } from "@hookform/resolvers/zod";

const skinTypes = [
  { label: "Normal", value: ProfilesSkinType.NORMAL },
  { label: "Combination", value: ProfilesSkinType.COMBINATION },
  { label: "Oily", value: ProfilesSkinType.OILY },
  { label: "Dry", value: ProfilesSkinType.DRY },
];

export default function ProfilePage() {
  const { profile, isLoading, mutate, isMutating } = useProfile();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    values: {
      skinIssues: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "skinIssues",
  });

  useEffect(() => {
    if (profile) {
      reset({
        skinType: profile.skinType ?? undefined,
        hasSensitiveSkin: profile.hasSensitiveSkin ?? false,
        skinIssues: (profile.skinIssues || []).map((issue) => ({
          value: issue,
        })),
      });
    }
  }, [profile, reset]);

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10">
        {/* Soft Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-secondary-200/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-primary-100/10 blur-[80px]" />

        {/* Subtle Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12">
        <header className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white shadow-sm border border-default-100">
            <UserIcon className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              My Skin Profile
            </h1>
            <p className="text-default-500">Tailor your skincare journey</p>
          </div>
        </header>

        <Card className="border-none shadow-xl bg-background/80 backdrop-blur-md">
          <CardBody className="gap-8 p-8">
            <form
              onSubmit={handleSubmit((v) => mutate(v))}
              className="space-y-8"
            >
              {/* Skin Type Field */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-secondary" />
                  <h2 className="font-semibold text-lg">
                    Skin Characteristics
                  </h2>
                </div>

                <Controller
                  name="skinType"
                  control={control}
                  render={({
                    field: { value, onChange, ...field },
                    fieldState: { invalid, error },
                  }) => (
                    <Select
                      {...field}
                      label="Skin Type"
                      placeholder="Select your skin type(s)"
                      variant="bordered"
                      labelPlacement="outside"
                      selectedKeys={value && new Set([value])}
                      onSelectionChange={(keys) =>
                        onChange(Array.from(keys)[0])
                      }
                      isInvalid={invalid}
                      errorMessage={error?.message}
                      classNames={{ trigger: "bg-content1" }}
                    >
                      {skinTypes.map((type) => (
                        <SelectItem key={type.value} textValue={type.label}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <Divider className="opacity-50" />

              {/* Sensitivity Field */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  <h2 className="font-semibold text-lg">Sensitivity</h2>
                </div>

                <Controller
                  name="hasSensitiveSkin"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Checkbox
                      {...field}
                      isSelected={value}
                      onValueChange={onChange}
                      color="primary"
                      classNames={{
                        label: "text-default-600 font-medium",
                      }}
                    >
                      I have sensitive skin
                    </Checkbox>
                  )}
                />
                <p className="text-xs text-default-400 ml-7">
                  Checking this helps us flag products with common irritants or
                  high fragrance.
                </p>
              </div>

              <Divider className="opacity-50" />

              {/* Skin Issues Array Field */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-5 text-secondary" />
                    <h2 className="font-semibold text-lg">Skin Concerns</h2>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<Plus className="size-4" />}
                    onPress={() => append({ value: "" })}
                  >
                    Add Issue
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <Input
                        {...register(`skinIssues.${index}.value` as const)}
                        variant="bordered"
                        placeholder="e.g. Acne, Redness, Hyper-pigmentation"
                        isInvalid={!!errors.skinIssues?.[index]?.value}
                        errorMessage={
                          errors.skinIssues?.[index]?.value?.message
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault(); // Stop form submission
                            if (index === fields.length - 1) {
                              append({ value: "" });
                            }
                          }
                        }}
                        endContent={
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => remove(index)}
                          >
                            <Trash2 className="size-4 text-danger-400" />
                          </Button>
                        }
                      />
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center p-6 border-2 border-dashed border-default-200 rounded-2xl">
                      <p className="text-default-400 text-sm">
                        No specific concerns added yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-bold shadow-lg shadow-primary/20"
                isLoading={isMutating}
              >
                Save Profile Changes
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 space-y-8">
      <div className="flex gap-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-100 w-full rounded-3xl" />
    </div>
  );
}
