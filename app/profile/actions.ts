"use server";

import { z } from "zod";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { normalizeDisplayName, normalizeHandle, isUniqueConstraintError } from "@/lib/profile";
import { requireViewer } from "@/lib/auth-session";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters.").max(32, "Display name must be 32 characters or fewer."),
  handle: z
    .string()
    .trim()
    .min(3, "Handle must be at least 3 characters.")
    .max(20, "Handle must be 20 characters or fewer.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Handle can only use letters, numbers, hyphens, and underscores."),
});

export interface ProfileActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors?: {
    displayName?: string[];
    handle?: string[];
  };
}

export const initialProfileActionState: ProfileActionState = {
  status: "idle",
  message: null,
};

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const viewer = await requireViewer();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const displayName = normalizeDisplayName(parsed.data.displayName, viewer.user.email);
  const handle = normalizeHandle(parsed.data.handle);

  if (handle.length < 3) {
    return {
      status: "error",
      message: "Handle must be at least 3 characters.",
      fieldErrors: {
        handle: ["Handle must be at least 3 characters after normalization."],
      },
    };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: viewer.user.id },
        data: {
          name: displayName,
        },
      }),
      prisma.profile.update({
        where: { userId: viewer.user.id },
        data: {
          displayName,
          handle,
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error, "handle")) {
      return {
        status: "error",
        message: "That handle is already taken.",
        fieldErrors: {
          handle: ["Choose a different handle."],
        },
      };
    }

    throw error;
  }

  revalidatePath("/");

  return {
    status: "success",
    message: "Profile updated.",
  };
}
