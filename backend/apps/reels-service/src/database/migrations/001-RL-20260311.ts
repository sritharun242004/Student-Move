import { MigrationInterface, QueryRunner } from 'typeorm';

export class RL001202603111773243500000 implements MigrationInterface {
  name = 'RL001202603111773243500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."student_profiles_status_enum" AS ENUM('ACTIVE', 'BANNED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" numeric NOT NULL,
        "displayName" character varying(200) NOT NULL,
        "profilePhotoUrl" text,
        "bio" text,
        "followersCount" integer NOT NULL DEFAULT 0,
        "followingCount" integer NOT NULL DEFAULT 0,
        "status" "public"."student_profiles_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_student_profiles" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "reels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "creatorId" uuid NOT NULL,
        "videoUrl" text NOT NULL,
        "durationSeconds" integer NOT NULL,
        "wasTrimmed" boolean NOT NULL DEFAULT false,
        "caption" text,
        "tags" text array NOT NULL DEFAULT '{}',
        "likesCount" integer NOT NULL DEFAULT 0,
        "commentsCount" integer NOT NULL DEFAULT 0,
        "sharesCount" integer NOT NULL DEFAULT 0,
        "popularityScore" double precision NOT NULL DEFAULT 0,
        "isFlagged" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reels" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "student_follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followerId" uuid NOT NULL,
        "followingId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_follows_pair" UNIQUE ("followerId", "followingId"),
        CONSTRAINT "PK_student_follows" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "reel_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reelId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_reel_likes_pair" UNIQUE ("reelId", "studentId"),
        CONSTRAINT "PK_reel_likes" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "reel_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reelId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "comment" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reel_comments" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "reel_shares" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reelId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_reel_shares_pair" UNIQUE ("reelId", "studentId"),
        CONSTRAINT "PK_reel_shares" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."reel_reports_status_enum" AS ENUM('PENDING', 'REVIEWED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reel_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reelId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "reason" character varying(200) NOT NULL,
        "details" text,
        "status" "public"."reel_reports_status_enum" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reel_reports" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "reels" ADD CONSTRAINT "FK_reels_creator" FOREIGN KEY ("creatorId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_follows" ADD CONSTRAINT "FK_student_follows_follower" FOREIGN KEY ("followerId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_follows" ADD CONSTRAINT "FK_student_follows_following" FOREIGN KEY ("followingId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_likes" ADD CONSTRAINT "FK_reel_likes_reel" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_likes" ADD CONSTRAINT "FK_reel_likes_student" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_comments" ADD CONSTRAINT "FK_reel_comments_reel" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_comments" ADD CONSTRAINT "FK_reel_comments_student" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_shares" ADD CONSTRAINT "FK_reel_shares_reel" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_shares" ADD CONSTRAINT "FK_reel_shares_student" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_reports" ADD CONSTRAINT "FK_reel_reports_reel" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reel_reports" ADD CONSTRAINT "FK_reel_reports_student" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_reels_createdAt" ON "reels" ("createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reels_popularity" ON "reels" ("popularityScore" DESC, "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reels_creator" ON "reels" ("creatorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_follows_follower" ON "student_follows" ("followerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_follows_following" ON "student_follows" ("followingId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reel_comments_reel" ON "reel_comments" ("reelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reel_reports_reel" ON "reel_reports" ("reelId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_reel_reports_reel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reel_comments_reel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_follows_following"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_follows_follower"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reels_creator"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reels_popularity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reels_createdAt"`);

    await queryRunner.query(`ALTER TABLE "reel_reports" DROP CONSTRAINT "FK_reel_reports_student"`);
    await queryRunner.query(`ALTER TABLE "reel_reports" DROP CONSTRAINT "FK_reel_reports_reel"`);
    await queryRunner.query(`ALTER TABLE "reel_shares" DROP CONSTRAINT "FK_reel_shares_student"`);
    await queryRunner.query(`ALTER TABLE "reel_shares" DROP CONSTRAINT "FK_reel_shares_reel"`);
    await queryRunner.query(`ALTER TABLE "reel_comments" DROP CONSTRAINT "FK_reel_comments_student"`);
    await queryRunner.query(`ALTER TABLE "reel_comments" DROP CONSTRAINT "FK_reel_comments_reel"`);
    await queryRunner.query(`ALTER TABLE "reel_likes" DROP CONSTRAINT "FK_reel_likes_student"`);
    await queryRunner.query(`ALTER TABLE "reel_likes" DROP CONSTRAINT "FK_reel_likes_reel"`);
    await queryRunner.query(`ALTER TABLE "student_follows" DROP CONSTRAINT "FK_student_follows_following"`);
    await queryRunner.query(`ALTER TABLE "student_follows" DROP CONSTRAINT "FK_student_follows_follower"`);
    await queryRunner.query(`ALTER TABLE "reels" DROP CONSTRAINT "FK_reels_creator"`);

    await queryRunner.query(`DROP TABLE "reel_reports"`);
    await queryRunner.query(`DROP TYPE "public"."reel_reports_status_enum"`);
    await queryRunner.query(`DROP TABLE "reel_shares"`);
    await queryRunner.query(`DROP TABLE "reel_comments"`);
    await queryRunner.query(`DROP TABLE "reel_likes"`);
    await queryRunner.query(`DROP TABLE "student_follows"`);
    await queryRunner.query(`DROP TABLE "reels"`);
    await queryRunner.query(`DROP TABLE "student_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."student_profiles_status_enum"`);
  }
}
