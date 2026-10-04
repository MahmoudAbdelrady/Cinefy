import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RESOURCE_NAME_PATTERN } from '../../shared/constants';

export const HALL_TYPE_NAME_ERROR_MESSAGES: Record<string, string> = {
  required: 'Hall type name is required',
  maxlength: 'Hall type name must not exceed 30 characters',
  pattern:
    'Name may only contain letters, numbers, single spaces, and hyphens, with no leading or trailing spaces',
};

export function createHallTypeForm() {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(RESOURCE_NAME_PATTERN),
      ],
    }),
  });
}
