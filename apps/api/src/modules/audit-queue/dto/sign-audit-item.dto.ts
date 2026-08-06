import { IsIn, IsString } from 'class-validator';

export class SignAuditItemDto {
  @IsIn(['signed', 'rejected'])
  decision!: 'signed' | 'rejected';

  /** Placeholder for a real digital-signature payload (e.g. hash of a signed PDF/cert). */
  @IsString()
  signatureHash!: string;
}
