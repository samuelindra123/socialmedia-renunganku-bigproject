import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  IsEnum,
} from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export class SendMessageDto {
  @ValidateIf((o) => !o.conversationId)
  @IsUUID()
  @IsOptional()
  recipientId?: string;

  @ValidateIf((o) => !o.recipientId)
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsString()
  @IsOptional()
  fileName?: string;
}
