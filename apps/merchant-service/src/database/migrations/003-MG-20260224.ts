import { MigrationInterface, QueryRunner } from 'typeorm';

export class MG003202602241771932400000 implements MigrationInterface {
  name = 'MG003202602241771932400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "offers" ADD "imageUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN "imageUrl"`);
  }
}
