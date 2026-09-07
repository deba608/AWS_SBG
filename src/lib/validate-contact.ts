export interface ContactInput {
  name: string;
  email: string;
  mobile: string;
}

export interface ContactErrors {
  name?: string;
  email?: string;
  mobile?: string;
}

export interface NormalizedContact {
  name: string;
  email: string;
  mobile: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-z][A-Za-z.'\- ]*$/;

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

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};

  const name = collapseName(input.name);
  if (name.length < 2) {
    errors.name = "Please enter your full name.";
  } else if (!NAME_RE.test(name)) {
    errors.name = "Name can only contain letters, spaces, . ' -";
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
  return {
    name: collapseName(input.name),
    email: normalizeEmail(input.email),
    mobile: normalizeMobile(input.mobile),
  };
}
