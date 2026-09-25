export type Gender = "Male" | "Female";
export type FoodPref = "Veg" | "Non-veg";

export interface RegistrationInput {
  fullName: string;
  rollNo: string;
  email: string;
  gender: string;
  food: string;
}

export interface RegistrationErrors {
  fullName?: string;
  rollNo?: string;
  email?: string;
  gender?: string;
  food?: string;
}

export interface NormalizedRegistration {
  name: string;
  rollNo: string;
  email: string;
  gender: Gender;
  food: FoodPref;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-z][A-Za-z.'\- ]*$/;
const ROLL_RE = /^[A-Za-z0-9][A-Za-z0-9/.\- ]{2,19}$/;

export const GENDERS: Gender[] = ["Male", "Female"];
export const FOODS: FoodPref[] = ["Veg", "Non-veg"];

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateRegistration(input: RegistrationInput): RegistrationErrors {
  const errors: RegistrationErrors = {};

  const name = collapseSpaces(input.fullName);
  if (!name) errors.fullName = "Full name is required.";
  else if (name.length < 2) errors.fullName = "Please enter your full name.";
  else if (!NAME_RE.test(name)) errors.fullName = "Letters, spaces ( . ' - ) only.";

  const roll = input.rollNo.trim().toUpperCase();
  if (!roll) errors.rollNo = "Roll number is required.";
  else if (!ROLL_RE.test(roll)) errors.rollNo = "Enter a valid roll number.";

  const email = normalizeEmail(input.email);
  if (!email) errors.email = "College mail is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  if (!GENDERS.includes(input.gender as Gender)) errors.gender = "Select gender.";
  if (!FOODS.includes(input.food as FoodPref)) errors.food = "Select food preference.";

  return errors;
}

export function normalizeRegistration(input: RegistrationInput): NormalizedRegistration {
  return {
    name: collapseSpaces(input.fullName),
    rollNo: input.rollNo.trim().toUpperCase(),
    email: normalizeEmail(input.email),
    gender: input.gender as Gender,
    food: input.food as FoodPref,
  };
}

// Back-compat aliases (old contact shape removed; kept names stable for imports)
export type ContactInput = RegistrationInput;
export type ContactErrors = RegistrationErrors;
export const validateContact = validateRegistration;
export const normalizedContact = normalizeRegistration;
