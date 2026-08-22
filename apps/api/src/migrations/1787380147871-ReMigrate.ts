import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReMigrate1787380147871 implements MigrationInterface {
  name = 'ReMigrate1787380147871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_refresh_tokens" ("id" SERIAL NOT NULL, "user_ext_id" character varying NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "rotated_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, CONSTRAINT "UQ_c23fc42230f22896ef533cc752f" UNIQUE ("token_hash"), CONSTRAINT "PK_c5f5cf35bd8aabd1ebe9bb13409" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "FK_6e5ec34fb0864359a875df664a8" FOREIGN KEY ("user_ext_id") REFERENCES "users"("external_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "FK_6e5ec34fb0864359a875df664a8"`,
    );
    await queryRunner.query(`DROP TABLE "user_refresh_tokens"`);
  }
}
