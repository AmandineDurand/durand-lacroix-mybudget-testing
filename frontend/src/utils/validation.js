export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("Minimum 8 caractères");
  if (password.length > 72) errors.push("Maximum 72 caractères");
  return errors;
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
};

export const validateUsername = (username) => {
  if (!username || username.length < 3) return "Minimum 3 caractères";
  return null;
};
