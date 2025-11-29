import { Injectable } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';

@Injectable()
export class MailService {
  constructor(private readonly resendService: ResendService) {}

  async sendVerificationEmail(email: string, token: string, otp: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    
    await this.resendService.send({
      from: 'Renunganku <welcome@renunganku.peakcenter.tech>',
      to: email,
      subject: 'Verifikasi Email Anda',
      html: `
        <h2>Verifikasi Akun Anda</h2>
        <p>Klik link berikut untuk verifikasi:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Atau gunakan kode OTP: <strong>${otp}</strong></p>
        <p>Kode berlaku selama 15 menit.</p>
      `,
    });
  }
}
