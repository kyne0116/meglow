import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContentService, EnglishWordRecord } from './content.service';
import { ListEnglishWordsQueryDto } from './dto/list-english-words-query.dto';

@ApiTags('content')
@UseGuards(JwtAuthGuard)
@Controller('content/english/words')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  listWords(@Query() query: ListEnglishWordsQueryDto): Promise<EnglishWordRecord[]> {
    return this.contentService.listEnglishWords({
      k12Stage: query.k12Stage,
      keyword: query.keyword,
      limit: query.limit,
    });
  }

  @Get(':wordId')
  getWord(@Param('wordId') wordId: string): Promise<EnglishWordRecord> {
    return this.contentService.getEnglishWord(wordId);
  }
}
