import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateOTP } from '../utils/otp.generator';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if email exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email sudah terdaftar');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Generate OTP dan verification token
        const otp = generateOTP();
        const verificationToken = this.generateRandomToken();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                namaLengkap: dto.namaLengkap,
                password: hashedPassword,
                verificationToken,
                verificationOtp: otp,
                otpExpiry,
            },
        });

        // Send verification email
        await this.mailService.sendVerificationEmail(
            user.email,
            verificationToken,
            otp,
        );

        return {
            message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
            userId: user.id,
        };
    }

    async verifyEmailByLink(token: string) {
        const user = await this.prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new BadRequestException('Token tidak valid');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email sudah terverifikasi');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationOtp: null,
                otpExpiry: null,
            },
        });

        return {
            message: 'Email berhasil diverifikasi!',
            accessToken: await this.generateAccessToken(user.id),
        };
    }

    async verifyEmailByOtp(userId: string, otp: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User tidak ditemukan');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email sudah terverifikasi');
        }

        if (!user.verificationOtp || user.verificationOtp !== otp) {
            throw new BadRequestException('OTP tidak valid');
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            throw new BadRequestException('OTP sudah expired');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationOtp: null,
                otpExpiry: null,
            },
        });

        return {
            message: 'Email berhasil diverifikasi!',
            accessToken: await this.generateAccessToken(user.id),
        };
    }

    async resendVerification(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User tidak ditemukan');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email sudah terverifikasi');
        }

        const otp = generateOTP();
        const verificationToken = this.generateRandomToken();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationOtp: otp,
                otpExpiry,
            },
        });

        await this.mailService.sendVerificationEmail(
            user.email,
            verificationToken,
            otp,
        );

        return { message: 'Email verifikasi telah dikirim ulang' };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email atau password salah');
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Email belum terverifikasi');
        }

        return {
            accessToken: await this.generateAccessToken(user.id),
            user: {
                id: user.id,
                email: user.email,
                namaLengkap: user.namaLengkap,
            },
        };
    }

    private async generateAccessToken(userId: string): Promise<string> {
        const payload = { sub: userId };
        return this.jwtService.signAsync(payload);
    }

    private generateRandomToken(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
