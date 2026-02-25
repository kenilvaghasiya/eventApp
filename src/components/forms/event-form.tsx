"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createEventAction, updateEventAction, uploadEventImageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { eventSchema, type EventInput } from "@/lib/validations";

interface EventFormProps {
  mode: "create" | "edit";
  sportOptions: string[];
  initialValues?: EventInput;
  redirectToDashboard?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
  stickyActions?: boolean;
}

const defaultValues: EventInput = {
  name: "",
  sportType: "",
  eventAt: "",
  description: "",
  imageUrl: "",
  imagePath: "",
  venues: [{ name: "", address: "" }]
};

const CUSTOM_SPORT_VALUE = "__custom__";

const eventFormSchema = eventSchema.extend({
  customSportType: z.string().optional()
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export function EventForm({
  mode,
  sportOptions,
  initialValues,
  redirectToDashboard = true,
  onCancel,
  onSuccess,
  stickyActions = false
}: EventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("");
  const router = useRouter();
  const resolvedInitialSport = initialValues?.sportType ?? defaultValues.sportType;
  const isInitialCustom = resolvedInitialSport ? !sportOptions.includes(resolvedInitialSport) : false;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...(initialValues ?? defaultValues),
      sportType: isInitialCustom ? CUSTOM_SPORT_VALUE : resolvedInitialSport,
      customSportType: isInitialCustom ? resolvedInitialSport : ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "venues"
  });

  const selectedSportType = form.watch("sportType");
  const showCustomSportInput = selectedSportType === CUSTOM_SPORT_VALUE;
  const existingImageUrl = form.watch("imageUrl");
  const previewUrl = localPreviewUrl || existingImageUrl || "";

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSubmit = (values: EventFormValues) => {
    const finalSportType =
      values.sportType === CUSTOM_SPORT_VALUE ? (values.customSportType ?? "").trim() : values.sportType;

    if (!finalSportType) {
      form.setError("customSportType", { message: "Please enter a sport type" });
      return;
    }

    const payload: EventInput = {
      id: values.id,
      name: values.name,
      sportType: finalSportType,
      eventAt: values.eventAt,
      description: values.description,
      imageUrl: values.imageUrl,
      imagePath: values.imagePath,
      venues: values.venues
    };

    startTransition(async () => {
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.set("image", selectedFile);
        const uploadResult = await uploadEventImageAction(imageFormData);
        if (!uploadResult.ok) {
          toast.error(uploadResult.error);
          return;
        }
        payload.imageUrl = uploadResult.data.imageUrl;
        payload.imagePath = uploadResult.data.imagePath;
      }

      const result = mode === "create" ? await createEventAction(payload) : await updateEventAction(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Success");
      if (redirectToDashboard) {
        router.push("/dashboard");
      }
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Event Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Sunday League Finals" {...field} />
                  </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sportType"
          render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sport Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select {...field}>
                  <option value="">Select sport type</option>
                  {sportOptions.map((sportType) => (
                    <option key={sportType} value={sportType}>
                      {sportType}
                    </option>
                  ))}
                  <option value={CUSTOM_SPORT_VALUE}>+ Add new sport type</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomSportInput ? (
          <FormField
            control={form.control}
            name="customSportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  New Sport Type <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter new sport type" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="eventAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date & Time <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Event details, teams, capacity, notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={() => (
            <FormItem>
              <FormLabel>Event Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
              </FormControl>
              <FormMessage />
              {previewUrl ? (
                <img src={previewUrl} alt="Event preview" className="mt-3 h-44 w-full rounded-md object-cover" />
              ) : null}
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Venues</h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => append({ name: "", address: "" })}>
              Add Venue
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-md border p-3">
              <FormField
                control={form.control}
                name={`venues.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Venue Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Downtown Arena" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`venues.${index}.address`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Venue Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fields.length > 1 ? (
                <Button type="button" size="sm" variant="destructive" onClick={() => remove(index)}>
                  Remove Venue
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "flex gap-3",
            stickyActions && "sticky bottom-0 z-10 -mx-6 border-t bg-white px-6 py-4"
          )}
        >
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create Event" : "Update Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
                return;
              }
              router.push("/dashboard");
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
