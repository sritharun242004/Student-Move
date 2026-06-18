import { MigrationInterface, QueryRunner } from "typeorm";

export class MG004202602241771928849895 implements MigrationInterface {
    name = 'MG004202602241771928849895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offers" ADD "amount" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN "amount"`);
    }

}
