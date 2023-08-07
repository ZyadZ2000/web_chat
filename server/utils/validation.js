export default function validate_fields(data, fieldOrder, validationSchemas) {
  const errors = {};

  for (const field in fieldOrder) {
    const { error } = validationSchemas[field].validate(data[field]);
    if (error) {
      errors[field] = error.details[0].message;
    }
  }

  return errors;
}
