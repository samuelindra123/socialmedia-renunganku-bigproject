import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { MinimumAge } from '../../common/validators/minimum-age.validator';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio maksimal 500 karakter' })
  bio?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  websites?: string[] | string;
}
