export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface ContactErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}

export interface NormalizedContact {
  /** Combined for the Sheet ("First Last"). */
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PART_RE = /^[A-Za-z][A-Za-z.'\-]*$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Strip spaces/separators, tolerate +91 / leading 0, return 10-digit form. */
export function normalizeMobile(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function collapseName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateNamePart(value: string): string | undefined {
  const part = collapseName(value);
  if (!part) return "This field is required.";
  if (!NAME_PART_RE.test(part)) {
    return "Letters only ( . ' - allowed).";
  }
  return undefined;
}

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};

  const firstError = validateNamePart(input.firstName);
  if (firstError) {
    errors.firstName = input.firstName.trim() ? firstError : "First name is required.";
  } else if (collapseName(input.firstName).length < 2) {
    errors.firstName = "Please enter your first name.";
  }

  const lastError = validateNamePart(input.lastName);
  if (lastError) {
    errors.lastName = input.lastName.trim() ? lastError : "Last name is required.";
  }

  const email = normalizeEmail(input.email);
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const mobile = normalizeMobile(input.mobile);
  if (!mobile) {
    errors.mobile = "Mobile number is required.";
  } else if (!/^[6-9]\d{9}$/.test(mobile)) {
    errors.mobile = "Enter a valid 10-digit Indian mobile number.";
  }

  return errors;
}

export function normalizedContact(input: ContactInput): NormalizedContact {
  const firstName = collapseName(input.firstName);
  const lastName = collapseName(input.lastName);
  return {
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email: normalizeEmail(input.email),
    mobile: normalizeMobile(input.mobile),
  };
}
