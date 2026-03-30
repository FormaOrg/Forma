import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css'
})
export class SettingsPreferences implements OnInit {
  preferencesForm!: FormGroup;
  isSaving = false;
  showDeleteModal = false;

  themes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'classic-dark', label: 'Classic Dark', icon: '🌙' },
    { id: 'system', label: 'System', icon: '💻' }
  ];

  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() {
    // Load saved preferences
  }

  private initForm() {
    this.preferencesForm = this.fb.group({
      theme: ['light', Validators.required],
      language: ['en', Validators.required]
    });
  }

  onSave() {
    if (this.preferencesForm.valid) {
      this.isSaving = true;
      // Simulate API call
      setTimeout(() => {
        this.isSaving = false;
        console.log('Preferences saved:', this.preferencesForm.value);
      }, 1500);
    }
  }

  onCancel() {
    this.preferencesForm.reset({
      theme: 'light',
      language: 'en'
    });
  }

  onDeleteAccount() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDeleteAccount() {
    this.showDeleteModal = false;
    console.log('Account deletion requested');
    // TODO: Call API to delete account
  }
}

