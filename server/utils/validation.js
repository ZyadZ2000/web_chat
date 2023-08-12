export default function validate_fields(fieldOrder, data, validationSchemas) {
  const errors = {};

  for (const field of fieldOrder) {
    const { error } = validationSchemas[field].validate(data[field]);
    if (error) {
      errors[field] = error.details[0].message;
    }
  }

  return errors;
}
