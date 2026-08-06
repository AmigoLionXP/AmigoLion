import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { computeGrowthScore } from './growth-score';

@Injectable()
export class DiagnosticsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiagnosticDto) {
    const growthScore = computeGrowthScore(dto.respostas);
    const diagnostic = await this.prisma.diagnostic.create({
      data: {
        companyId: dto.companyId,
        gargalo: dto.gargalo,
        respostas: dto.respostas,
        growthScore,
        status: dto.status ?? 'partial',
      },
    });

    if (dto.companyId && diagnostic.status === 'complete') {
      await this.prisma.company.update({
        where: { id: dto.companyId },
        data: { growthScore },
      });
    }

    return diagnostic;
  }
}
