import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentItemType, ReviewStatus, SubjectCode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListAdminContentItemsQueryDto {
  @ApiPropertyOptional({ enum: SubjectCode, example: SubjectCode.ENGLISH })
  @IsOptional()
  @IsEnum(SubjectCode)
  subjectCode?: SubjectCode;

  @ApiPropertyOptional({ enum: ContentItemType, example: ContentItemType.TEXT })
  @IsOptional()
  @IsEnum(ContentItemType)
  itemType?: ContentItemType;

  @ApiPropertyOptional({ enum: ReviewStatus, example: ReviewStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ReviewStatus)
  reviewStatus?: ReviewStatus;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
