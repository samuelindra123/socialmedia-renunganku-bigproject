import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty({ message: 'Content tidak boleh kosong' })
    content: string;
}
