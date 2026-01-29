const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.com',
  'mailinator.com',
  'guerrillamail.com',
  'fakeinbox.com',
  '10minutemail.com',
  'trashmail.com',
  'yopmail.com',
  'temp-mail.org',
  'dispostable.com'
];

export const validateRow = (row) => {
  const errors = [];

  const nameErrors = validateName(row.name);
  if (nameErrors.length > 0) {
    errors.push(...nameErrors);
  }

  const emailErrors = validateEmail(row.email);
  if (emailErrors.length > 0) {
    errors.push(...emailErrors);
  }

  const phoneErrors = validatePhone(row.phone);
  if (phoneErrors.length > 0) {
    errors.push(...phoneErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateName = (name) => {
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Name is required');
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  const specialCharRegex = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?0-9]/;
  if (specialCharRegex.test(trimmedName)) {
    errors.push('Name must not contain special characters or numbers');
  }

  return errors;
};

const validateEmail = (email) => {
  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('Email is required');
    return errors;
  }

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format');
    return errors;
  }

  const domain = trimmedEmail.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    errors.push('Disposable email domains are not allowed');
  }

  return errors;
};

const validatePhone = (phone) => {
  const errors = [];

  if (!phone || phone.toString().trim() === '') {
    errors.push('Phone is required');
    return errors;
  }

  const cleanedPhone = phone.toString().replace(/[\s\-\(\)]/g, '');

  if (!/^\d+$/.test(cleanedPhone)) {
    errors.push('Phone must contain only numbers');
    return errors;
  }

  if (cleanedPhone.length !== 10) {
    errors.push('Phone must be exactly 10 digits');
  }

  const validStartDigits = ['6', '7', '8', '9'];
  if (!validStartDigits.includes(cleanedPhone[0])) {
    errors.push('Phone must start with 6, 7, 8, or 9');
  }

  return errors;
};
