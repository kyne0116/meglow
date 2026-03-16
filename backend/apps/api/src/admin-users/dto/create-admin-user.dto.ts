import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'editor_01' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @ApiProperty({ example: '内容编辑A' })
  @IsString()
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ example: 'Editor@123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ enum: AdminRole, example: AdminRole.CONTENT_EDITOR })
  @IsEnum(AdminRole)
  role!: AdminRole;
}
