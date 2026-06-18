import { MigrationInterface, QueryRunner } from "typeorm";

export class MG005202602251772025500000 implements MigrationInterface {
    name = 'MG005202602251772025500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offers" ADD "usedCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN "usedCount"`);
    }

}
