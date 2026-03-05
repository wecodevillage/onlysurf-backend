import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialNetworkType, PrivacyLevel } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Bio/description' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;
}

export class CreateSocialNetworkDto {
  @ApiProperty({
    enum: SocialNetworkType,
    description: 'Type of social network',
    example: 'INSTAGRAM',
  })
  type: SocialNetworkType;

  @ApiProperty({
    description: 'Social network handle or URL',
    example: '@surfer123',
  })
  value: string;

  @ApiPropertyOptional({
    enum: PrivacyLevel,
    description: 'Privacy level',
    default: 'PUBLIC',
  })
  privacy?: PrivacyLevel;
}

export class UpdateSocialNetworkDto {
  @ApiPropertyOptional({
    enum: SocialNetworkType,
    description: 'Type of social network',
  })
  type?: SocialNetworkType;

  @ApiPropertyOptional({
    description: 'Social network handle or URL',
  })
  value?: string;

  @ApiPropertyOptional({
    enum: PrivacyLevel,
    description: 'Privacy level',
  })
  privacy?: PrivacyLevel;
}

export class CreateServiceDto {
  @ApiProperty({ description: 'Service title', example: 'Private Coaching' })
  title: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'One-on-one coaching session',
  })
  description?: string;

  @ApiProperty({ description: 'Price', example: 50 })
  price: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'EUR' })
  currency?: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Service title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Service description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Price' })
  price?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  isActive?: boolean;
}

export class CreateProfilePhotoDto {
  @ApiProperty({ description: 'Photo URL' })
  url: string;

  @ApiPropertyOptional({ description: 'Photo description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  order?: number;
}

export class UpdateProfilePhotoDto {
  @ApiPropertyOptional({ description: 'Photo URL' })
  url?: string;

  @ApiPropertyOptional({ description: 'Photo description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  order?: number;
}
