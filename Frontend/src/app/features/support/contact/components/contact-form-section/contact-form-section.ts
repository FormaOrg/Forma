import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form-section',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form-section.html',
  styleUrl: './contact-form-section.css',
})
export class ContactFormSection {
  isSubmitting = false;
  submitted = false;
  errorMessage = '';

  contactForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: [''],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    this.submitted = false;
    this.errorMessage = '';

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.errorMessage = 'Please fill in the required fields correctly.';
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      console.log('Contact form data:', this.contactForm.getRawValue());

      this.isSubmitting = false;
      this.submitted = true;

      this.contactForm.reset({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 800);
  }
}