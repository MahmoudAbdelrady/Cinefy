import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CinefyInput } from 'cinefy-ui/components';
import { SearchIcon } from '../../shared/icons';
import { PASSWORD_PATTERN } from '../../shared/validation';

@Component({
  selector: 'test-page',
  imports: [CinefyInput],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly icons = {
    SearchIcon,
  };

  protected readonly name = new FormControl('', { nonNullable: true });
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(PASSWORD_PATTERN)],
  });
  protected readonly reference = new FormControl('', { nonNullable: true });
}
