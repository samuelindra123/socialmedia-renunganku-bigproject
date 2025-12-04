import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-auth-login">
      <h1>Admin Login</h1>
      <p>Halaman login admin (auth) belum dikonfigurasi penuh.</p>
    </div>
  `,
})
export class LoginComponent {}
