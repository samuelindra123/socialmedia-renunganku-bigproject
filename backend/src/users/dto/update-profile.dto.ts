import { IsString, IsOptional, MinLength, MaxLength, Matches, IsDateString } from 'class-validator';
import { MinimumAge } from '../../common/validators/minimum-age.validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    namaLengkap?: string;

    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Username minimal 3 karakter' })
    @MaxLength(20, { message: 'Username maksimal 20 karakter' })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username hanya boleh huruf, angka, dan underscore',
    })
    username?: string;

    @IsOptional()
    @IsDateString()
    @MinimumAge(13, { message: 'Umur minimal 13 tahun' })
    tanggalLahir?: string;

    @IsOptional()
    @IsString()
    tempatKelahiran?: string;
}
