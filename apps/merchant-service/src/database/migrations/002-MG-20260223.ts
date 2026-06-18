import { MigrationInterface, QueryRunner } from "typeorm";

export class MG002202602231771843077454 implements MigrationInterface {
    name = 'MG002202602231771843077454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "merchant_profiles" DROP CONSTRAINT "UQ_8177c1c1fafa1d05177b9a45329"`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" ADD "userId" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" ADD CONSTRAINT "UQ_8177c1c1fafa1d05177b9a45329" UNIQUE ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "merchant_profiles" DROP CONSTRAINT "UQ_8177c1c1fafa1d05177b9a45329"`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "merchant_profiles" ADD CONSTRAINT "UQ_8177c1c1fafa1d05177b9a45329" UNIQUE ("userId")`);
    }

}
