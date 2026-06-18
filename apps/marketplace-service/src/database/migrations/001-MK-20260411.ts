import { MigrationInterface, QueryRunner } from "typeorm";

export class MK001202604111775883699289 implements MigrationInterface {
    name = 'MK001202604111775883699289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "marketplace_categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "parentId" integer, CONSTRAINT "PK_ccbec861df6ee237ddbe895c6d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "marketplace_listing_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listingId" uuid NOT NULL, "photoUrl" text NOT NULL, "displayOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_a16c4721b8866d6fee8e9495536" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."marketplace_listings_listingtype_enum" AS ENUM('SINGLE', 'STOCK')`);
        await queryRunner.query(`CREATE TYPE "public"."marketplace_listings_status_enum" AS ENUM('ACTIVE', 'SOLD', 'REMOVED')`);
        await queryRunner.query(`CREATE TABLE "marketplace_listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" integer NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "location" character varying(200) NOT NULL, "categoryId" integer NOT NULL, "listingType" "public"."marketplace_listings_listingtype_enum" NOT NULL, "totalStock" integer, "soldItems" integer NOT NULL DEFAULT '0', "contactNumber" character varying(50) NOT NULL, "status" "public"."marketplace_listings_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_060673e8fb9a86172be30c612df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "marketplace_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listingId" uuid NOT NULL, "buyerStudentId" integer NOT NULL, "sellerStudentId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6755fe970bef69396a858ab7a58" UNIQUE ("listingId", "buyerStudentId"), CONSTRAINT "PK_8b593b4d0abd21d91ac7993ddee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "marketplace_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "senderStudentId" integer NOT NULL, "content" text NOT NULL, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f6242085396e522d9ef20822c0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "marketplace_categories" ADD CONSTRAINT "FK_54da0596bd8ae562413987d9927" FOREIGN KEY ("parentId") REFERENCES "marketplace_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "marketplace_listing_photos" ADD CONSTRAINT "FK_8252502d44116d81892ea9f253a" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "marketplace_listings" ADD CONSTRAINT "FK_0dc5a56de3a5ceb36141a4d7983" FOREIGN KEY ("categoryId") REFERENCES "marketplace_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "marketplace_conversations" ADD CONSTRAINT "FK_60ae1bc3b3b5044531ad021499d" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "marketplace_messages" ADD CONSTRAINT "FK_54a4a06d5cd3ef903cfef7cf7fe" FOREIGN KEY ("conversationId") REFERENCES "marketplace_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "marketplace_messages" DROP CONSTRAINT "FK_54a4a06d5cd3ef903cfef7cf7fe"`);
        await queryRunner.query(`ALTER TABLE "marketplace_conversations" DROP CONSTRAINT "FK_60ae1bc3b3b5044531ad021499d"`);
        await queryRunner.query(`ALTER TABLE "marketplace_listings" DROP CONSTRAINT "FK_0dc5a56de3a5ceb36141a4d7983"`);
        await queryRunner.query(`ALTER TABLE "marketplace_listing_photos" DROP CONSTRAINT "FK_8252502d44116d81892ea9f253a"`);
        await queryRunner.query(`ALTER TABLE "marketplace_categories" DROP CONSTRAINT "FK_54da0596bd8ae562413987d9927"`);
        await queryRunner.query(`DROP TABLE "marketplace_messages"`);
        await queryRunner.query(`DROP TABLE "marketplace_conversations"`);
        await queryRunner.query(`DROP TABLE "marketplace_listings"`);
        await queryRunner.query(`DROP TYPE "public"."marketplace_listings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."marketplace_listings_listingtype_enum"`);
        await queryRunner.query(`DROP TABLE "marketplace_listing_photos"`);
        await queryRunner.query(`DROP TABLE "marketplace_categories"`);
    }

}
