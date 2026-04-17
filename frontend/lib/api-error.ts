import { isAxiosError } from "axios";

type ErrorBody = {
  message?: string;
  errors?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
};

function firstFieldMessage(body: ErrorBody): string | null {
  const fe = body.errors?.fieldErrors;
  if (!fe) return null;
  for (const [key, arr] of Object.entries(fe)) {
    if (Array.isArray(arr) && arr[0]) {
      return `${key}: ${arr[0]}`;
    }
  }
  return null;
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ErrorBody | undefined;
    if (data?.message && typeof data.message === "string") {
      if (data.message === "Validation failed") {
        const detail = firstFieldMessage(data);
        if (detail) {
          return `${data.message} (${detail})`;
        }
      }
      return data.message;
    }
    if (typeof error.message === "string" && error.message) {
      return error.message;
    }
  }
  return fallback;
}
