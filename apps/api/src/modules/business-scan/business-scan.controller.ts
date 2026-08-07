import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BusinessScanStepKey, IntegrationProvider } from '@prisma/client';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { BusinessScanService } from './business-scan.service';
import { SaveSectionDto } from './dto/save-section.dto';
import { BUSINESS_SCAN_STEPS } from './business-scan-schema';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from './business-scan-validation';

const STEP_KEYS = new Set(BUSINESS_SCAN_STEPS.map((s) => s.key));
const INTEGRATION_PROVIDERS = new Set<string>([
  'erp',
  'crm',
  'contabilidade',
  'marketing',
  'open_banking',
  'google',
  'meta',
  'stripe',
  'whatsapp',
]);

const UPLOADS_ROOT = path.resolve(process.env.UPLOADS_DIR ?? './uploads');

function assertStepKey(value: string): BusinessScanStepKey {
  if (!STEP_KEYS.has(value as BusinessScanStepKey)) throw new BadRequestException(`Etapa inválida: ${value}`);
  return value as BusinessScanStepKey;
}

function assertProvider(value: string): IntegrationProvider {
  if (!INTEGRATION_PROVIDERS.has(value)) throw new BadRequestException(`Integração inválida: ${value}`);
  return value as IntegrationProvider;
}

@Controller('me/business-scan')
@Roles('client')
export class BusinessScanController {
  constructor(private businessScan: BusinessScanService) {}

  @Get()
  getScan(@CurrentUser() user: AuthUser) {
    return this.businessScan.getScan(user.sub, user.companyId);
  }

  @Patch('sections/:stepKey')
  saveSection(@CurrentUser() user: AuthUser, @Param('stepKey') stepKeyParam: string, @Body() dto: SaveSectionDto) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.businessScan.saveSection(user.sub, user.companyId, stepKey, dto.data, dto.skippedFields);
  }

  @Post('sections/:stepKey/complete')
  completeSection(@CurrentUser() user: AuthUser, @Param('stepKey') stepKeyParam: string) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.businessScan.completeSection(user.sub, user.companyId, stepKey);
  }

  @Post('complete')
  completeScan(@CurrentUser() user: AuthUser) {
    return this.businessScan.completeScan(user.sub, user.companyId);
  }

  @Post('integrations/:provider/connect')
  connectIntegration(@CurrentUser() user: AuthUser, @Param('provider') providerParam: string) {
    const provider = assertProvider(providerParam);
    return this.businessScan.connectIntegration(user.sub, user.companyId, provider);
  }

  @Post('sections/:stepKey/files')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }))
  async uploadFile(
    @CurrentUser() user: AuthUser,
    @Param('stepKey') stepKeyParam: string,
    @Body('fieldKey') fieldKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const stepKey = assertStepKey(stepKeyParam);
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    if (!fieldKey) throw new BadRequestException('fieldKey é obrigatório.');
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado. Envie PDF, Word, Excel, CSV ou imagem.');
    }

    const dir = path.join(UPLOADS_ROOT, user.companyId ?? 'unknown', stepKey);
    await fs.mkdir(dir, { recursive: true });
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${randomUUID()}-${safeName}`;
    const fullPath = path.join(dir, storedName);
    await fs.writeFile(fullPath, file.buffer);

    return this.businessScan.uploadFile(user.sub, user.companyId, stepKey, fieldKey, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: fullPath,
    });
  }

  @Get('files/:fileId')
  async downloadFile(@CurrentUser() user: AuthUser, @Param('fileId') fileId: string, @Res() res: Response) {
    const file = await this.businessScan.getFileForDownload(user.sub, user.companyId, fileId);
    try {
      const buffer = await fs.readFile(file.storagePath);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.send(buffer);
    } catch {
      throw new NotFoundException('Arquivo não encontrado no armazenamento.');
    }
  }

  @Delete('files/:fileId')
  async deleteFile(@CurrentUser() user: AuthUser, @Param('fileId') fileId: string) {
    const file = await this.businessScan.deleteFile(user.sub, user.companyId, fileId);
    await fs.unlink(file.storagePath).catch(() => {});
    return { deleted: true };
  }
}
