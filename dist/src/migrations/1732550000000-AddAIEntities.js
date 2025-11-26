"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAIEntities1732550000000 = void 0;
class AddAIEntities1732550000000 {
    constructor() {
        this.name = 'AddAIEntities1732550000000';
    }
    async up(queryRunner) {
        // Create ai_analyses table
        await queryRunner.query(`
            CREATE TABLE "ai_analyses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "submissionId" uuid NOT NULL,
                "summary" text NOT NULL,
                "overallQuality" character varying(50) NOT NULL,
                "insights" jsonb NOT NULL,
                "suggestions" jsonb,
                "confidence" double precision NOT NULL,
                "modelVersion" character varying(100) NOT NULL,
                "tokensUsed" integer,
                "processingTimeMs" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ai_analyses" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ai_analyses_submission" FOREIGN KEY ("submissionId") 
                    REFERENCES "submissions"("id") ON DELETE CASCADE
            )
        `);
        // Create index on submissionId for faster lookups
        await queryRunner.query(`
            CREATE INDEX "IDX_ai_analyses_submission" ON "ai_analyses" ("submissionId")
        `);
        // Create rule_templates table
        await queryRunner.query(`
            CREATE TABLE "rule_templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "prompt" text NOT NULL,
                "generatedRules" jsonb NOT NULL,
                "companyId" uuid,
                "isPublic" boolean NOT NULL DEFAULT false,
                "usageCount" integer NOT NULL DEFAULT 0,
                "createdBy" uuid NOT NULL,
                "category" character varying(50),
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_rule_templates" PRIMARY KEY ("id"),
                CONSTRAINT "FK_rule_templates_company" FOREIGN KEY ("companyId") 
                    REFERENCES "companies"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_rule_templates_user" FOREIGN KEY ("createdBy") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        // Create indexes for rule_templates
        await queryRunner.query(`
            CREATE INDEX "IDX_rule_templates_company" ON "rule_templates" ("companyId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_rule_templates_public" ON "rule_templates" ("isPublic")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_rule_templates_category" ON "rule_templates" ("category")
        `);
        // Create ai_conversations table
        await queryRunner.query(`
            CREATE TABLE "ai_conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "projectId" uuid,
                "messages" jsonb NOT NULL,
                "context" jsonb,
                "title" character varying(100),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ai_conversations_user" FOREIGN KEY ("userId") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_ai_conversations_project" FOREIGN KEY ("projectId") 
                    REFERENCES "projects"("id") ON DELETE CASCADE
            )
        `);
        // Create indexes for ai_conversations
        await queryRunner.query(`
            CREATE INDEX "IDX_ai_conversations_user" ON "ai_conversations" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ai_conversations_project" ON "ai_conversations" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ai_conversations_active" ON "ai_conversations" ("isActive")
        `);
    }
    async down(queryRunner) {
        // Drop ai_conversations table and indexes
        await queryRunner.query(`DROP INDEX "IDX_ai_conversations_active"`);
        await queryRunner.query(`DROP INDEX "IDX_ai_conversations_project"`);
        await queryRunner.query(`DROP INDEX "IDX_ai_conversations_user"`);
        await queryRunner.query(`DROP TABLE "ai_conversations"`);
        // Drop rule_templates table and indexes
        await queryRunner.query(`DROP INDEX "IDX_rule_templates_category"`);
        await queryRunner.query(`DROP INDEX "IDX_rule_templates_public"`);
        await queryRunner.query(`DROP INDEX "IDX_rule_templates_company"`);
        await queryRunner.query(`DROP TABLE "rule_templates"`);
        // Drop ai_analyses table and indexes
        await queryRunner.query(`DROP INDEX "IDX_ai_analyses_submission"`);
        await queryRunner.query(`DROP TABLE "ai_analyses"`);
    }
}
exports.AddAIEntities1732550000000 = AddAIEntities1732550000000;
