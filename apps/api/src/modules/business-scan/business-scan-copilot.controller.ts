import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BusinessScanStepKey } from '@prisma/client';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { BusinessScanCopilotService } from './business-scan-copilot.service';
import { BusinessScanService } from './business-scan.service';
import { BUSINESS_SCAN_STEPS } from './business-scan-schema';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from './business-scan-validation';
import { GuidedChallengeDto } from './dto/guided-challenge.dto';
import { VoiceTranscriptDto } from './dto/voice-transcript.dto';

const STEP_KEYS = new Set(BUSINESS_SCAN_STEPS.map((s) => s.key));
const UPLOADS_ROOT = path.resolve(process.env.UPLOADS_DIR ?? './uploads');

function assertStepKey(value: string): BusinessScanStepKey {
  if (!STEP_KEYS.has(value as BusinessScanStepKey)) throw new BadRequestException(`Etapa inválida: ${value}`);
  return value as BusinessScanStepKey;
}

function assertLang(value?: string): 'pt' | 'en' {
  return value === 'en' ? 'en' : 'pt';
}

@Controller('me/business-scan/copilot')
@Roles('client')
export class BusinessScanCopilotController {
  constructor(
    private copilot: BusinessScanCopilotService,
    private businessScan: BusinessScanService,
  ) {}

  @Get('intro/:stepKey')
  getStepIntro(@Param('stepKey') stepKeyParam: string, @Query('lang') lang?: string) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.copilot.getStepIntro(stepKey, assertLang(lang));
  }

  @Get('field-help/:stepKey/:fieldKey')
  getFieldHelp(
    @Param('stepKey') stepKeyParam: string,
    @Param('fieldKey') fieldKey: string,
    @Query('lang') lang?: string,
  ) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.copilot.getFieldHelp(stepKey, fieldKey, assertLang(lang));
  }

  @Get('challenge-examples')
  getChallengeExamples(@Query('lang') lang?: string) {
    return this.copilot.getChallengeExamples(assertLang(lang));
  }

  @Post('guided-challenge')
  answerGuidedChallenge(@Body() dto: GuidedChallengeDto, @Query('lang') lang?: string) {
    return this.copilot.answerGuidedChallenge(dto.answers, assertLang(lang));
  }

  @Get('missing/:stepKey')
  getMissingSummary(
    @CurrentUser() user: AuthUser,
    @Param('stepKey') stepKeyParam: string,
    @Query('lang') lang?: string,
  ) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.copilot.getMissingSummary(user.sub, user.companyId, stepKey, assertLang(lang));
  }

  @Get('executive-summary')
  getExecutiveSummary(@CurrentUser() user: AuthUser, @Query('lang') lang?: string) {
    return this.copilot.getExecutiveSummary(user.sub, user.companyId, assertLang(lang));
  }

  /**
   * "Tenho esse documento" — saves the upload exactly like the plain upload endpoint
   * (it counts toward the step's completion the same way) and, on top of that, runs
   * real text extraction to suggest field values for the user to review.
   */
  @Post('sections/:stepKey/voice')
  answerVoice(@CurrentUser() user: AuthUser, @Param('stepKey') stepKeyParam: string, @Body() dto: VoiceTranscriptDto) {
    const stepKey = assertStepKey(stepKeyParam);
    return this.copilot.analyzeVoiceTranscript(user.sub, user.companyId, stepKey, dto.text, dto.fieldKey);
  }

  @Post('sections/:stepKey/extract')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }))
  async extractFromFile(
    @CurrentUser() user: AuthUser,
    @Param('stepKey') stepKeyParam: string,
    @Body('fieldKey') fieldKey: string,
    @Query('lang') lang?: string,
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
    const fullPath = path.join(dir, `${randomUUID()}-${safeName}`);
    await fs.writeFile(fullPath, file.buffer);

    const [savedFile, extraction] = await Promise.all([
      this.businessScan.uploadFile(user.sub, user.companyId, stepKey, fieldKey, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: fullPath,
      }),
      this.copilot.extractFromFile(user.sub, user.companyId, stepKey, fieldKey, file.buffer, file.mimetype, assertLang(lang)),
    ]);

    return { file: savedFile, ...extraction };
  }
}
