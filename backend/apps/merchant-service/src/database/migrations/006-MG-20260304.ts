import { MigrationInterface, QueryRunner } from "typeorm";

export class MG006202603041772569568045 implements MigrationInterface {
    name = 'MG006202603041772569568045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "qrData"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "qrData" text NOT NULL`);
    }

}
