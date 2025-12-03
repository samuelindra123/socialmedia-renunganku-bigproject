import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        namaLengkap: true,
        isEmailVerified: true,
        createdAt: true,
        profile: {
          select: {
            username: true,
            profileImageUrl: true,
            backgroundImageUrl: true,
            websites: true,
            umur: true,
            tanggalLahir: true,
            tempatKelahiran: true,
            isOnboardingComplete: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async getUserByUsername(username: string, requesterId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Public profile view
    return {
      id: profile.user.id,
      username: profile.username,
      namaLengkap: profile.user.namaLengkap,
      profileImageUrl: profile.profileImageUrl,
      backgroundImageUrl: profile.backgroundImageUrl,
      websites: profile.websites,
      umur: profile.umur,
      tempatKelahiran: profile.tempatKelahiran,
      memberSince: profile.user.createdAt,
      isOwnProfile: requesterId === profile.user.id,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    files?: {
      profileImage?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Check username uniqueness
    if (dto.username && dto.username !== user.profile?.username) {
      const existingProfile = await this.prisma.profile.findUnique({
        where: { username: dto.username },
      });

      if (existingProfile) {
        throw new BadRequestException('Username sudah digunakan');
      }
    }

    // Upload new profile image if provided
    let profileImageUrl = user.profile?.profileImageUrl;
    if (files?.profileImage?.[0]) {
      // Delete old image
      if (profileImageUrl) {
        try {
          await this.spacesService.deleteFile(profileImageUrl);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }
      profileImageUrl = await this.spacesService.uploadFile(
        files.profileImage[0],
        'profiles',
      );
    }

    // Upload new background image if provided
    let backgroundImageUrl = user.profile?.backgroundImageUrl;
    if (files?.backgroundImage?.[0]) {
      // Delete old background image
      if (backgroundImageUrl) {
        try {
          await this.spacesService.deleteFile(backgroundImageUrl);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }
      backgroundImageUrl = await this.spacesService.uploadFile(
        files.backgroundImage[0],
        'backgrounds',
      );
    }

    // Calculate age if birthdate changed
    let umur = user.profile?.umur;
    if (dto.tanggalLahir) {
      const birthDate = new Date(dto.tanggalLahir);
      umur = this.calculateAge(birthDate);

      if (umur < 13) {
        throw new BadRequestException('Umur minimal 13 tahun');
      }
    }

    // Update user data
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        namaLengkap: dto.namaLengkap || user.namaLengkap,
      },
      include: { profile: true },
    });

    // Update profile data
    if (user.profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          username: dto.username || user.profile.username,
          profileImageUrl,
          backgroundImageUrl,
          websites:
            dto.websites ?? user.profile.websites,
          umur: umur || user.profile.umur,
          tanggalLahir: dto.tanggalLahir
            ? new Date(dto.tanggalLahir)
            : user.profile.tanggalLahir,
          tempatKelahiran: dto.tempatKelahiran || user.profile.tempatKelahiran,
        },
      });
    }

    return this.getMyProfile(userId);
  }

  async searchUsers(dto: SearchUsersDto) {
    const { q, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const whereClause = q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' as const } },
            {
              user: {
                namaLengkap: { contains: q, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          username: true,
          profileImageUrl: true,
          user: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.profile.count({ where: whereClause }),
    ]);

    return {
      data: profiles.map((profile) => ({
        username: profile.username,
        namaLengkap: profile.user.namaLengkap,
        profileImageUrl: profile.profileImageUrl,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
}
