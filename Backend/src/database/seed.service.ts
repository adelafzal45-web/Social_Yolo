import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  Brand,
  CreditAccount,
  CreativeVariant,
  Invoice,
  Organization,
  Project,
  Subscription,
  SubscriptionPlan,
  User,
} from './entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(CreditAccount)
    private readonly creditRepo: Repository<CreditAccount>,
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(CreativeVariant)
    private readonly creativeRepo: Repository<CreativeVariant>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDatabase();
  }

  async seedDatabase() {
    try {
      // 1. Seed Subscription Plans
      const plans = [
        {
          name: 'Free Trial',
          priceCents: 0,
          monthlyCredits: 4,
          maxTeamSeats: 1,
          maxClientFolders: 0,
        },
        {
          name: 'Starter',
          priceCents: 1900,
          monthlyCredits: 100,
          maxTeamSeats: 2,
          maxClientFolders: 1,
        },
        {
          name: 'Pro',
          priceCents: 4900,
          monthlyCredits: 350,
          maxTeamSeats: 5,
          maxClientFolders: 4,
        },
        {
          name: 'Agency',
          priceCents: 9900,
          monthlyCredits: 1000,
          maxTeamSeats: 10,
          maxClientFolders: 10,
        },
      ];

      for (const p of plans) {
        const exists = await this.planRepo.findOne({ where: { name: p.name } });
        if (!exists) {
          await this.planRepo.save(this.planRepo.create(p));
        }
      }

      // 2. Seed Default Organization
      let org = await this.orgRepo.findOne({ where: { slug: 'brightpath' } });
      if (!org) {
        org = await this.orgRepo.save(
          this.orgRepo.create({
            name: 'Brightpath Agency',
            slug: 'brightpath',
            tier: 'Pro',
          }),
        );
        this.logger.log(`Created primary organization: ${org.name}`);
      }

      // 3. Seed Credit Account
      let creditAcc = await this.creditRepo.findOne({
        where: { organizationId: org.id },
      });
      if (!creditAcc) {
        creditAcc = await this.creditRepo.save(
          this.creditRepo.create({
            organizationId: org.id,
            balance: 214,
            reservedBalance: 0,
          }),
        );
        this.logger.log(
          `Initialized credit account for ${org.name} with 214 credits`,
        );
      }

      // 4. Seed Users
      const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
      const passwordHashCreator = await bcrypt.hash('Creator@123', 10);
      const passwordHashUser = await bcrypt.hash('User@123', 10);

      const defaultUsers = [
        {
          email: 'admin@socialyolo.local',
          fullName: 'System Administrator',
          passwordHash: passwordHashAdmin,
          role: 'ADMIN',
          permissions: [
            'image:remove-background',
            'image:admin',
            'image:view',
            'project.manage',
            'credits.manage',
          ],
        },
        {
          email: 'creator@socialyolo.local',
          fullName: 'Content Creator',
          passwordHash: passwordHashCreator,
          role: 'CREATOR',
          permissions: [
            'image:remove-background',
            'image:view',
            'project.create',
            'creative.generate',
          ],
        },
        {
          email: 'riya@brightpath.agency',
          fullName: 'Riya Malhotra',
          passwordHash: passwordHashCreator,
          role: 'CREATOR',
          permissions: [
            'image:remove-background',
            'image:view',
            'project.create',
            'creative.generate',
            'billing.manage',
          ],
        },
        {
          email: 'restricted@socialyolo.local',
          fullName: 'Restricted User',
          passwordHash: passwordHashUser,
          role: 'GUEST',
          permissions: ['image:view'],
        },
      ];

      for (const u of defaultUsers) {
        const userExists = await this.userRepo.findOne({
          where: { email: u.email },
        });
        if (!userExists) {
          await this.userRepo.save(
            this.userRepo.create({
              ...u,
              organizationId: org.id,
            }),
          );
        }
      }

      // 5. Seed Brand Profile
      let brand = await this.brandRepo.findOne({
        where: { organizationId: org.id, name: 'Meridian Coffee Co.' },
      });
      if (!brand) {
        brand = await this.brandRepo.save(
          this.brandRepo.create({
            organizationId: org.id,
            name: 'Meridian Coffee Co.',
            tagline: 'Small-batch specialty beans, roasted weekly.',
            description:
              'Small-batch specialty coffee roaster, warm and premium feel, focused on single-origin beans.',
            websiteUrl: 'https://www.meridiancoffeeco.com',
            niche: 'food_beverage',
            colors: {
              primary: '#c98a3f',
              secondary: '#3a2c5a',
              accent: '#e0aa4e',
              background: '#0d0d14',
              text: '#ffffff',
            },
            fonts: {
              display: 'Fraktion Serif, Georgia, serif',
              body: 'Söhne Fallback, Inter, sans-serif',
            },
            tone: 'Warm',
          }),
        );
        this.logger.log(`Seeded brand: ${brand.name}`);
      }

      // 6. Seed Project & Creative Variants
      let project = await this.projectRepo.findOne({
        where: { organizationId: org.id, name: 'Ramadan Restock — Insta' },
      });
      if (!project && brand) {
        project = await this.projectRepo.save(
          this.projectRepo.create({
            organizationId: org.id,
            brandId: brand.id,
            brandName: brand.name,
            clientFolder: 'Meridian workspace',
            name: 'Ramadan Restock — Insta',
            status: 'approved',
            outputMode: 'creative',
            platforms: [
              'instagram_portrait',
              'facebook_feed',
              'pinterest_pin',
              'twitter_feed',
            ],
            style: 'lifestyle',
            contentType: 'static',
            quantity: 4,
            originalPhotoUrl: '',
            backgroundMode: 'ai_replace',
            backgroundPreset: 'Warm Studio',
            copy: {
              headline: 'Small batch. Big morning.',
              body: 'Roasted in 12kg batches, every Tuesday. Restocking this Friday — set a reminder.',
              occasion: 'Limited edition',
            },
            creditsUsed: 16,
          }),
        );

        const variants = [
          {
            projectId: project.id,
            platformKey: 'instagram_portrait',
            platformName: 'Instagram',
            width: 1080,
            height: 1350,
            label: '1080×1350 · Feed portrait',
            style: 'lifestyle',
            headline: 'Small batch. Big morning.',
            body: 'Roasted in 12kg batches, every Tuesday.',
            ctaText: 'SHOP NOW',
            textCoveragePct: 14,
            metaPass: true,
            status: 'approved' as const,
          },
          {
            projectId: project.id,
            platformKey: 'facebook_feed',
            platformName: 'Facebook',
            width: 1200,
            height: 628,
            label: '1200×628 · Link ad',
            style: 'lifestyle',
            headline: 'Small batch. Big morning.',
            body: 'Roasted in 12kg batches, every Tuesday.',
            ctaText: 'ORDER NOW',
            textCoveragePct: 12,
            metaPass: true,
            status: 'approved' as const,
          },
          {
            projectId: project.id,
            platformKey: 'pinterest_pin',
            platformName: 'Pinterest',
            width: 1000,
            height: 1500,
            label: '1000×1500 · Pin',
            style: 'lifestyle',
            headline: 'Small batch. Big morning.',
            body: 'Roasted in 12kg batches, every Tuesday.',
            ctaText: 'EXPLORE',
            textCoveragePct: 13,
            metaPass: true,
            status: 'approved' as const,
          },
          {
            projectId: project.id,
            platformKey: 'twitter_feed',
            platformName: 'Twitter / X',
            width: 1200,
            height: 628,
            label: '1200×628 · Feed',
            style: 'lifestyle',
            headline: 'Small batch. Big morning.',
            body: 'Roasted in 12kg batches, every Tuesday.',
            ctaText: 'LEARN MORE',
            textCoveragePct: 11,
            metaPass: true,
            status: 'approved' as const,
          },
        ];

        for (const v of variants) {
          await this.creativeRepo.save(this.creativeRepo.create(v));
        }
      }

      // 7. Seed Invoices
      const invCount = await this.invoiceRepo.count({
        where: { organizationId: org.id },
      });
      if (invCount === 0) {
        await this.invoiceRepo.save([
          this.invoiceRepo.create({
            organizationId: org.id,
            amountCents: 4900,
            amountFormatted: '$49.00',
            description: 'Pro plan — monthly renewal',
            status: 'Paid',
          }),
          this.invoiceRepo.create({
            organizationId: org.id,
            amountCents: 500,
            amountFormatted: '$5.00',
            description: 'Top-up — 50 credits',
            status: 'Paid',
          }),
        ]);
      }
    } catch (err: any) {
      this.logger.warn(`Database seeding note: ${err.message}`);
    }
  }
}
