import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsIn(['starter', 'pro', 'agency'])
  planId?: string;

  @IsOptional()
  @IsIn(['starter_pack', 'creator_pack', 'agency_pack'])
  packId?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class VerifyPaymentDto {
  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  trackerToken?: string;
}

export class AdjustCreditsDto {
  @IsNumber()
  amount!: number; // can be positive (grant) or negative (deduct)

  @IsString()
  reason!: string;
}
