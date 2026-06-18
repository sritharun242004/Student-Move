import { MigrationInterface, QueryRunner } from "typeorm";

export class MG007202603041772570203326 implements MigrationInterface {
    name = 'MG007202603041772570203326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "studentId"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "studentId" numeric NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "studentId"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "studentId" uuid NOT NULL`);
    }

}
