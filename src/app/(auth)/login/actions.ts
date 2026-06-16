"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/lib/auth"

export type LoginState = {
  error?: string
}

function getSafeCallbackUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username")
  const password = formData.get("password")
  const redirectTo = getSafeCallbackUrl(formData.get("callbackUrl"))

  if (typeof username !== "string" || typeof password !== "string") {
    return { error: "Vui l\u00f2ng nh\u1eadp t\u00ean \u0111\u0103ng nh\u1eadp v\u00e0 m\u1eadt kh\u1ea9u" }
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "T\u00ean \u0111\u0103ng nh\u1eadp ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c" }
    }

    throw error
  }

  return {}
}
