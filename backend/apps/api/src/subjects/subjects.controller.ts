import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { SubjectRecord, SubjectsService } from './subjects.service';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  listSubjects(@Query() query: ListSubjectsQueryDto): Promise<SubjectRecord[]> {
    return this.subjectsService.listSubjects(query.enabled);
  }
}
