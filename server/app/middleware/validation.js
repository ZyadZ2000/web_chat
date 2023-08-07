import validate_fields from '../../utils/validation.js';
import joiSchema from '../../config/joi.js';

export default function validate_data(req, res, next) {
  const { email, password, passwordConfirm, username } = req.body;
  const errors = validate_fields(
    {
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      username: username,
    },
    ['email', 'password', 'passwordConfirm', 'username'],
    {
      email: joiSchema.emailSchema,
      password: joiSchema.passwordSchema,
      passwordConfirm: joiSchema.passwordSchema,
      username: joiSchema.usernameSchema,
    }
  );
  if (errors) {
    return res.status(400).json({ errors: errors });
  }
  if (passwordConfirm && password !== passwordConfirm) {
    return res
      .status(400)
      .json({ errors: { passwordConfirm: 'Passwords do not match' } });
  }
  next();
}
