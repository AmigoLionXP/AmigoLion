import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto });
  }
}
