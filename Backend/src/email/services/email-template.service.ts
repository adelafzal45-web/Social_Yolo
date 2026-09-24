import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailTemplateEntity,
  EmailTemplateCategory,
  EmailTemplateStatus,
} from '../entities/email-template.entity';

@Injectable()
export class EmailTemplateService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly templateRepo: Repository<EmailTemplateEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultTemplates();
  }

  /**
   * Renders dynamic variables into template HTML and text safely.
   */
  render(templateHtml: string, context: Record<string, any>): string {
    if (!templateHtml) return '';

    // Flatten nested object keys (e.g. { user: { name: 'John' } } => { 'user.name': 'John' })
    const flat: Record<string, string> = {};
    const flatten = (obj: any, prefix = '') => {
      for (const [k, v] of Object.entries(obj || {})) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
          flatten(v, fullKey);
        } else if (v !== undefined && v !== null) {
          flat[fullKey] = String(v);
        }
      }
    };
    flatten(context);

    // Replace {{key}}
    let rendered = templateHtml.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      return flat[key] !== undefined ? flat[key] : match;
    });

    return rendered;
  }

  async findAll(category?: EmailTemplateCategory): Promise<EmailTemplateEntity[]> {
    const where = category ? { category } : {};
    return this.templateRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<EmailTemplateEntity | null> {
    return this.templateRepo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<EmailTemplateEntity | null> {
    return this.templateRepo.findOne({ where: { slug } });
  }

  async create(data: Partial<EmailTemplateEntity>): Promise<EmailTemplateEntity> {
    const template = this.templateRepo.create(data);
    return this.templateRepo.save(template);
  }

  async update(id: string, data: Partial<EmailTemplateEntity>): Promise<EmailTemplateEntity> {
    await this.templateRepo.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.templateRepo.delete(id);
    return Boolean(res.affected && res.affected > 0);
  }

  /**
   * Seeds production-ready responsive email templates.
   */
  async seedDefaultTemplates() {
    const count = await this.templateRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding production email templates...');

    const defaultTemplates: Partial<EmailTemplateEntity>[] = [
      // 1. Promotional Offer Template
      {
        name: 'Special Offer / Flash Deal',
        slug: 'special-offer-flash-deal',
        category: EmailTemplateCategory.OFFER,
        subject: 'Special Offer: Save {{offer.discount}} on SocialYolo!',
        variables: [
          'user.name',
          'offer.title',
          'offer.description',
          'offer.discount',
          'offer.code',
          'offer.expiresAt',
          'offer.ctaUrl',
          'campaign.unsubscribeUrl',
        ],
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; }
    .container { max-width: 600px; margin: 30px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header { padding: 32px 24px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; color: #e0e7ff; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; border: 1px solid rgba(129, 140, 248, 0.3); }
    .title { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
    .description { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px; }
    .coupon-box { background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .coupon-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: 2px; }
    .coupon-expires { font-size: 12px; color: #64748b; margin-top: 6px; }
    .cta-btn { display: block; width: fit-content; margin: 28px auto 0; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
    .terms { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #334155; padding-top: 16px; line-height: 1.5; }
    .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; background-color: #0b0f19; border-top: 1px solid #1e293b; }
    .footer a { color: #818cf8; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SocialYolo</h1>
      <p>AI Creative Studio & Brand Intelligence</p>
    </div>
    <div class="content">
      <div class="badge">Exclusive Creator Deal</div>
      <h2 class="title">{{offer.title}}</h2>
      <p class="description">Hi {{user.name}},</p>
      <p class="description">{{offer.description}}</p>
      
      <div class="coupon-box">
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">Use coupon code at checkout:</div>
        <div class="coupon-code">{{offer.code}}</div>
        <div class="coupon-expires">Discount: {{offer.discount}} • Expires: {{offer.expiresAt}}</div>
      </div>

      <a href="{{offer.ctaUrl}}" class="cta-btn">Claim Your Offer Now &rarr;</a>

      <div class="terms">
        <strong>Terms & Conditions:</strong> Valid for a limited time on eligible SocialYolo subscription and top-up plans. Cannot be combined with other ongoing promotions.
      </div>
    </div>
    <div class="footer">
      <p>You received this email because you are a registered user of SocialYolo.</p>
      <p>
        <a href="{{campaign.unsubscribeUrl}}">Unsubscribe</a> • 
        <a href="{{campaign.unsubscribeUrl}}">Manage Email Preferences</a>
      </p>
      <p>&copy; 2026 SocialYolo, Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      },

      // 2. Welcome Email Template
      {
        name: 'Welcome to SocialYolo',
        slug: 'welcome-onboarding',
        category: EmailTemplateCategory.TRANSACTIONAL,
        subject: 'Welcome to SocialYolo, {{user.name}}! ✨',
        variables: ['user.name', 'user.email', 'app.url'],
        htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { margin: 0; font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
  .box { max-width: 580px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 40px; }
  h1 { color: #ffffff; font-size: 24px; margin-top: 0; }
  p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
  .cta { display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px; }
</style></head>
<body>
  <div class="box">
    <h1>Welcome to SocialYolo! 🚀</h1>
    <p>Hi {{user.name}},</p>
    <p>We're thrilled to have you! SocialYolo gives you autonomous AI brand intelligence, automated background removal, and studio-quality creative generation.</p>
    <p>Your account has been credited with <strong>50 free creation credits</strong> so you can start immediately.</p>
    <a href="{{app.url}}/dashboard" class="cta">Launch Creator Studio &rarr;</a>
  </div>
</body></html>`,
      },

      // 3. Password Reset
      {
        name: 'Password Reset Request',
        slug: 'password-reset',
        category: EmailTemplateCategory.SECURITY,
        subject: 'Reset your SocialYolo password',
        variables: ['user.name', 'reset.url', 'reset.expiresIn'],
        htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { margin: 0; font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
  .box { max-width: 580px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 40px; }
  h1 { color: #ffffff; font-size: 22px; }
  p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
  .btn { display: inline-block; padding: 12px 28px; background: #e11d48; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
</style></head>
<body>
  <div class="box">
    <h1>Password Reset Request</h1>
    <p>Hi {{user.name}},</p>
    <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for {{reset.expiresIn}}.</p>
    <a href="{{reset.url}}" class="btn">Reset My Password</a>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</body></html>`,
      },

      // 4. Password Changed
      {
        name: 'Password Changed Confirmation',
        slug: 'password-changed',
        category: EmailTemplateCategory.SECURITY,
        subject: 'Your SocialYolo password was changed',
        variables: ['user.name', 'security.time', 'security.ip'],
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; padding:40px 10px;">
  <div style="max-width:540px; margin:0 auto; background:#1e293b; border-radius:12px; padding:32px; border:1px solid #334155;">
    <h2 style="color:#ffffff; margin-top:0;">Security Alert: Password Changed</h2>
    <p style="color:#94a3b8;">Hi {{user.name}},</p>
    <p style="color:#94a3b8;">Your SocialYolo password was successfully updated on {{security.time}} from IP {{security.ip}}.</p>
    <p style="color:#ef4444;">If you did not make this change, please contact support immediately.</p>
  </div>
</body></html>`,
      },

      // 5. Subscription Started / Renewal
      {
        name: 'Subscription Confirmed',
        slug: 'subscription-confirmed',
        category: EmailTemplateCategory.TRANSACTIONAL,
        subject: 'Your SocialYolo {{subscription.plan}} plan is active!',
        variables: ['user.name', 'subscription.plan', 'subscription.credits', 'subscription.amount'],
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; padding:40px 10px;">
  <div style="max-width:560px; margin:0 auto; background:#1e293b; border-radius:12px; padding:32px; border:1px solid #334155;">
    <h2 style="color:#38bdf8; margin-top:0;">Subscription Confirmed! 🎉</h2>
    <p style="color:#94a3b8;">Hi {{user.name}},</p>
    <p style="color:#94a3b8;">Your <strong>{{subscription.plan}}</strong> subscription has been activated with {{subscription.credits}} monthly creation credits.</p>
    <p style="color:#94a3b8;">Thank you for creating with SocialYolo!</p>
  </div>
</body></html>`,
      },
    ];

    for (const t of defaultTemplates) {
      await this.templateRepo.save(this.templateRepo.create(t));
    }

    this.logger.log(`Seeded ${defaultTemplates.length} default production email templates.`);
  }
}
