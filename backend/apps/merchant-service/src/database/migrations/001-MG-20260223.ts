import { MigrationInterface, QueryRunner } from "typeorm";

export class MG001202602231771829422658 implements MigrationInterface {
    name = 'MG001202602231771829422658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "merchant_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "businessName" character varying(200) NOT NULL, "description" text, "businessEmail" character varying(320) NOT NULL, "phone" character varying(30) NOT NULL, "address" text NOT NULL, "isApproved" boolean NOT NULL DEFAULT false, "isSuspended" boolean NOT NULL DEFAULT false, "secretCodeHash" character varying(200), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8177c1c1fafa1d05177b9a45329" UNIQUE ("userId"), CONSTRAINT "PK_ee17ef073cf4fe64ffb6292f88e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."offers_discounttype_enum" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT')`);
        await queryRunner.query(`CREATE TABLE "offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merchantId" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "discountType" "public"."offers_discounttype_enum" NOT NULL, "usageLimit" integer, "perStudentLimit" integer NOT NULL, "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."redemption_records_status_enum" AS ENUM('SUCCESS', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "redemption_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "voucherId" uuid NOT NULL, "merchantId" uuid NOT NULL, "scannedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."redemption_records_status_enum" NOT NULL, "reason" character varying(400), CONSTRAINT "PK_fb73c97aae66d1c485e508b7022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."vouchers_status_enum" AS ENUM('PENDING', 'REDEEMED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "vouchers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "offerId" uuid NOT NULL, "studentId" uuid NOT NULL, "uniqueCode" character varying(64) NOT NULL, "qrData" text NOT NULL, "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."vouchers_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f71ef6c193d853daa479110268f" UNIQUE ("uniqueCode"), CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_6eafb53332e67989342b71e244c" FOREIGN KEY ("merchantId") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "redemption_records" ADD CONSTRAINT "FK_3893000986f3e98bdfe6372dbdb" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "redemption_records" ADD CONSTRAINT "FK_8597092dbcca3b0d996d64f7c1c" FOREIGN KEY ("merchantId") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD CONSTRAINT "FK_d82da7afdfd8005eccce475d1b8" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" DROP CONSTRAINT "FK_d82da7afdfd8005eccce475d1b8"`);
        await queryRunner.query(`ALTER TABLE "redemption_records" DROP CONSTRAINT "FK_8597092dbcca3b0d996d64f7c1c"`);
        await queryRunner.query(`ALTER TABLE "redemption_records" DROP CONSTRAINT "FK_3893000986f3e98bdfe6372dbdb"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_6eafb53332e67989342b71e244c"`);
        await queryRunner.query(`DROP TABLE "vouchers"`);
        await queryRunner.query(`DROP TYPE "public"."vouchers_status_enum"`);
        await queryRunner.query(`DROP TABLE "redemption_records"`);
        await queryRunner.query(`DROP TYPE "public"."redemption_records_status_enum"`);
        await queryRunner.query(`DROP TABLE "offers"`);
        await queryRunner.query(`DROP TYPE "public"."offers_discounttype_enum"`);
        await queryRunner.query(`DROP TABLE "merchant_profiles"`);
    }

}
