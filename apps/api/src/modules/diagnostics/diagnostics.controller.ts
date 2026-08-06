import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/public.decorator';
import { DiagnosticsService } from './diagnostics.service';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private diagnostics: DiagnosticsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateDiagnosticDto) {
    return this.diagnostics.create(dto);
  }
}
