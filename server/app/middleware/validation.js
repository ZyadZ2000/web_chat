import validate_fields from '../../utils/validation.js';

export default function validate_data(fields, validationSchemas, dataSource) {
  return function (req, res, next) {
    const errors = validate_fields(
      fields,
      dataSource === 'params'
        ? req.params
        : dataSource === 'query'
        ? req.query
        : req.body,
      validationSchemas
    );
    if (Object.keys(errors).length !== 0) {
      return res.status(400).json({ errors: errors });
    }
    if (
      req.body.passwordConfirm &&
      req.body.password !== req.body.passwordConfirm
    ) {
      return res.status(400).json({
        errors: { passwordConfirm: 'Passwords do not match' },
      });
    }
    return next();
  };
}
