import { MigrationInterface, QueryRunner } from "typeorm";

export class MG009202603051777007800000 implements MigrationInterface {
    name = 'MG009202603051777007800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "merchant_profiles" ADD "profileImageUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "merchant_profiles" DROP COLUMN "profileImageUrl"`);
    }

}
