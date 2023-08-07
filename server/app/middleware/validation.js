import validate_fields from '../../utils/validation.js';
import * as joiSchema from '../../config/joi.js';

export default function validate_data(fields) {
  return function (req, res, next) {
    const { email, password, passwordConfirm, username, token } = req.body;
    const errors = validate_fields(
      {
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
        username: username,
        token: token,
      },
      fields,
      {
        email: joiSchema.emailSchema,
        password: joiSchema.passwordSchema,
        passwordConfirm: joiSchema.passwordSchema,
        username: joiSchema.usernameSchema,
        token: joiSchema.tokenSchema,
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
  };
}
