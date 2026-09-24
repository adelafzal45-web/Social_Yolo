import 'dotenv/config';
import { Client } from 'pg';

export async function runIntelligenceMigration() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:admin@localhost:5432/social_yolo',
  });

  await client.connect();
  console.log('Running AI Content Intelligence Engine database migration...');

  try {
    await client.query('BEGIN');

    // 1. Ensure uuid-ossp or pgcrypto
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Adjust/create brands table to match Spec Section 9
    await client.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID,
        workspace_id UUID,
        user_id UUID,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        website_url TEXT,
        niche VARCHAR(100),
        industry VARCHAR(255),
        sub_industry VARCHAR(255),
        country VARCHAR(100),
        city VARCHAR(150),
        description TEXT,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color VARCHAR(30) DEFAULT '#7c5cff',
        secondary_color VARCHAR(30) DEFAULT '#e0aa4e',
        accent_color VARCHAR(30) DEFAULT '#ffffff',
        secondary_colors JSONB DEFAULT '[]'::jsonb,
        colors JSONB DEFAULT '{}'::jsonb,
        fonts JSONB DEFAULT '{}'::jsonb,
        font_heading VARCHAR(100) DEFAULT 'Plus Jakarta Sans',
        font_body VARCHAR(100) DEFAULT 'Inter',
        tone VARCHAR(50) DEFAULT 'Warm',
        is_default BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'active',
        brand_voice JSONB DEFAULT '{}'::jsonb,
        social_links JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add any missing columns to existing brands table
    const brandColumns = [
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "workspace_id" UUID;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "industry" VARCHAR(255);`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "sub_industry" VARCHAR(255);`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "country" VARCHAR(100);`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "city" VARCHAR(150);`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "favicon_url" TEXT;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "primary_color" VARCHAR(30) DEFAULT '#7c5cff';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "secondary_color" VARCHAR(30) DEFAULT '#e0aa4e';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "accent_color" VARCHAR(30) DEFAULT '#ffffff';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "secondary_colors" JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "font_heading" VARCHAR(100) DEFAULT 'Plus Jakarta Sans';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "font_body" VARCHAR(100) DEFAULT 'Inter';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'active';`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "brand_voice" JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "social_links" JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "user_id" UUID;`,
    ];
    for (const sql of brandColumns) {
      await client.query(sql);
    }

    // Populate workspace_id with organization_id where missing
    await client.query(`
      UPDATE "brands" SET "workspace_id" = "organization_id" WHERE "workspace_id" IS NULL AND "organization_id" IS NOT NULL;
    `);

    // 3. Ensure brand_profiles table has matching columns for legacy compatibility
    await client.query(`
      CREATE TABLE IF NOT EXISTS "brand_profiles" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        workspace_id UUID,
        brand_name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        niche VARCHAR(100) DEFAULT 'General',
        description TEXT,
        website_url VARCHAR(255),
        logo_url TEXT,
        primary_color VARCHAR(30) DEFAULT '#7c5cff',
        secondary_color VARCHAR(30) DEFAULT '#e0aa4e',
        accent_color VARCHAR(30) DEFAULT '#3ecf8e',
        font_heading VARCHAR(100) DEFAULT 'Canela',
        font_body VARCHAR(100) DEFAULT 'Söhne',
        tone VARCHAR(50) DEFAULT 'Warm',
        is_default BOOLEAN DEFAULT false,
        industry VARCHAR(255),
        sub_industry VARCHAR(255),
        country VARCHAR(100),
        city VARCHAR(150),
        favicon_url TEXT,
        secondary_colors JSONB,
        status VARCHAR(50) DEFAULT 'active',
        brand_voice JSONB,
        social_links JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    const profileColumns = [
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "workspace_id" UUID;`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "industry" VARCHAR(255);`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "sub_industry" VARCHAR(255);`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "country" VARCHAR(100);`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "city" VARCHAR(150);`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "favicon_url" TEXT;`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "secondary_colors" JSONB;`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'active';`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "brand_voice" JSONB;`,
      `ALTER TABLE "brand_profiles" ADD COLUMN IF NOT EXISTS "social_links" JSONB;`,
    ];
    for (const sql of profileColumns) {
      await client.query(sql);
    }

    // 4. brand_insights table (Spec Section 10)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "brand_insights" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        brand_id UUID NOT NULL,
        company_description TEXT,
        value_proposition TEXT,
        products JSONB DEFAULT '[]'::jsonb,
        services JSONB DEFAULT '[]'::jsonb,
        target_audience JSONB DEFAULT '[]'::jsonb,
        locations JSONB DEFAULT '[]'::jsonb,
        benefits JSONB DEFAULT '[]'::jsonb,
        pain_points JSONB DEFAULT '[]'::jsonb,
        keywords JSONB DEFAULT '[]'::jsonb,
        categories JSONB DEFAULT '[]'::jsonb,
        social_links JSONB DEFAULT '{}'::jsonb,
        brand_voice JSONB DEFAULT '{}'::jsonb,
        source_urls JSONB DEFAULT '[]'::jsonb,
        confidence JSONB DEFAULT '{}'::jsonb,
        field_sources JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_brand_insights_brand_id" ON "brand_insights"("brand_id");
    `);

    // 5. brand_sources table (Spec Section 11)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "brand_sources" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        brand_id UUID NOT NULL,
        url TEXT NOT NULL,
        page_type VARCHAR(100),
        title TEXT,
        description TEXT,
        content TEXT,
        content_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        last_crawled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_brand_sources_brand_id" ON "brand_sources"("brand_id");
    `);

    // 6. inspiration_items table (Spec Section 22)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inspiration_items" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider VARCHAR(100) NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        external_url TEXT,
        title TEXT,
        description TEXT,
        author_name VARCHAR(255),
        author_url TEXT,
        media_type VARCHAR(50) DEFAULT 'image',
        image_url TEXT,
        thumbnail_url TEXT,
        video_url TEXT,
        width INTEGER,
        height INTEGER,
        tags JSONB DEFAULT '[]'::jsonb,
        colors JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        license_info JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT "uq_inspiration_provider_external_id" UNIQUE (provider, external_id)
      );
      CREATE INDEX IF NOT EXISTS "idx_inspiration_provider" ON "inspiration_items"("provider");
    `);

    // 7. inspiration_analysis table (Spec Section 23)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inspiration_analysis" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        inspiration_item_id UUID NOT NULL REFERENCES "inspiration_items"("id") ON DELETE CASCADE,
        visual_style JSONB DEFAULT '{}'::jsonb,
        composition JSONB DEFAULT '{}'::jsonb,
        color_palette JSONB DEFAULT '[]'::jsonb,
        typography JSONB DEFAULT '{}'::jsonb,
        layout_type VARCHAR(100),
        subject_type VARCHAR(100),
        emotion VARCHAR(100),
        content_type VARCHAR(100),
        industry VARCHAR(100),
        embedding REAL[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_inspiration_analysis_item" ON "inspiration_analysis"("inspiration_item_id");
    `);

    // 8. inspiration_collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inspiration_collections" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workspace_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        item_ids JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_inspiration_collections_workspace" ON "inspiration_collections"("workspace_id");
    `);

    // 9. content_concepts table (Spec Section 28)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "content_concepts" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        brand_id UUID NOT NULL,
        campaign_id UUID,
        pillar_id UUID,
        title VARCHAR(255) NOT NULL,
        concept TEXT,
        hook TEXT,
        angle TEXT,
        visual_direction JSONB DEFAULT '{}'::jsonb,
        platforms JSONB DEFAULT '[]'::jsonb,
        inspiration_ids JSONB DEFAULT '[]'::jsonb,
        trend_ids JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_content_concepts_brand_id" ON "content_concepts"("brand_id");
    `);

    // 10. posts table columns (Spec Section 29)
    await client.query(`
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "brand_id" UUID;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "concept_id" UUID;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "campaign_id" UUID;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content_type" VARCHAR(100);
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "caption" TEXT;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "body" TEXT;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "cta" TEXT;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "hashtags" JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMPTZ;
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ;
    `);

    // 11. ai_generations table (Spec Section 30)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ai_generations" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workspace_id UUID,
        user_id UUID,
        task_type VARCHAR(100) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        model VARCHAR(150) NOT NULL,
        input JSONB DEFAULT '{}'::jsonb,
        output JSONB DEFAULT '{}'::jsonb,
        prompt_version VARCHAR(100) DEFAULT 'v1',
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        cost DECIMAL(10, 4) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_ai_generations_workspace" ON "ai_generations"("workspace_id");
      CREATE INDEX IF NOT EXISTS "idx_ai_generations_task" ON "ai_generations"("task_type");
    `);

    // 12. post_metrics table (Spec Section 31)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "post_metrics" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID NOT NULL,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        watch_time INTEGER DEFAULT 0,
        ctr DECIMAL(8, 4) DEFAULT 0,
        engagement_rate DECIMAL(8, 4) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_post_metrics_post_id" ON "post_metrics"("post_id");
    `);

    // 13. content_performance_insights table (Spec Section 31)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "content_performance_insights" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        brand_id UUID NOT NULL,
        pattern_type VARCHAR(100) NOT NULL,
        insight TEXT NOT NULL,
        confidence DECIMAL(5, 2) DEFAULT 0.85,
        metrics_summary JSONB DEFAULT '{}'::jsonb,
        recommendations JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_performance_insights_brand" ON "content_performance_insights"("brand_id");
    `);

    await client.query('COMMIT');
    console.log('AI Content Intelligence Engine database migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runIntelligenceMigration().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
