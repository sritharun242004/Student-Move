import { MigrationInterface, QueryRunner } from "typeorm";

export class MG008202603041772621207053 implements MigrationInterface {
    name = 'MG008202603041772621207053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."vouchers_status_enum" RENAME TO "vouchers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vouchers_status_enum" AS ENUM('PENDING', 'REDEEMED')`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" TYPE "public"."vouchers_status_enum" USING "status"::"text"::"public"."vouchers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."vouchers_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vouchers_status_enum_old" AS ENUM('PENDING', 'REDEEMED', 'EXPIRED')`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" TYPE "public"."vouchers_status_enum_old" USING "status"::"text"::"public"."vouchers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."vouchers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vouchers_status_enum_old" RENAME TO "vouchers_status_enum"`);
    }

}
