import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuotations1794131707384 implements MigrationInterface {
  name = 'CreateQuotations1794131707384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quotation_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "original_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" integer NOT NULL, "sha256" character(64) NOT NULL, "storage_key" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e51caef27f30944737ba7fcff97" UNIQUE ("quotation_id", "sha256"), CONSTRAINT "PK_019804b7b4cd75b57fd421c3443" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotation_recipients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "vendor_id" uuid NOT NULL, "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_71d7fb231246c83e7e4f5f24cd6" UNIQUE ("quotation_id", "vendor_id"), CONSTRAINT "PK_3337686b5b34cee1c17dcc89c99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3049ba518070dbd8e46d4b5a5b" ON "quotation_recipients"  ("vendor_id", "sent_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotations_event_type_enum" AS ENUM('wedding', 'corporate', 'birthday', 'conference', 'concert', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "event_type" "public"."quotations_event_type_enum" NOT NULL, "event_date" date NOT NULL, "location" character varying NOT NULL, "guest_count" integer, "response_deadline" date, "description" text, "created_by_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_quotations_title_event_date_location" UNIQUE ("title", "event_date", "location"), CONSTRAINT "CHK_quotations_guest_count_positive" CHECK ("guest_count" IS NULL OR "guest_count" > 0), CONSTRAINT "CHK_quotations_deadline_before_event" CHECK ("response_deadline" IS NULL OR "response_deadline" <= "event_date"), CONSTRAINT "PK_6c00eb8ba181f28c21ffba7ecb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97545f4be1d294d5f95ee01229" ON "quotations"  ("created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quotation_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "name" character varying NOT NULL, "quantity" integer NOT NULL, "unit" character varying, "notes" text, "position" integer NOT NULL, CONSTRAINT "CHK_quotation_items_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_a5ff0786836b65d12bafd0ac91e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deb19b87a686bb85b202edb6cd" ON "quotation_items"  ("quotation_id", "position") `,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_photos" ADD CONSTRAINT "FK_c79bc4c89cd56f9b0526b84f1b8" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_recipients" ADD CONSTRAINT "FK_1f3cb383726055c443527d6b48b" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_recipients" ADD CONSTRAINT "FK_2f3213377cada14394b7434c1e6" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotations" ADD CONSTRAINT "FK_1913a8a219355f660bc53c486f3" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ADD CONSTRAINT "FK_c9e2dea84928feba1d24874c160" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotation_items" DROP CONSTRAINT "FK_c9e2dea84928feba1d24874c160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotations" DROP CONSTRAINT "FK_1913a8a219355f660bc53c486f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_recipients" DROP CONSTRAINT "FK_2f3213377cada14394b7434c1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_recipients" DROP CONSTRAINT "FK_1f3cb383726055c443527d6b48b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_photos" DROP CONSTRAINT "FK_c79bc4c89cd56f9b0526b84f1b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_deb19b87a686bb85b202edb6cd"`,
    );
    await queryRunner.query(`DROP TABLE "quotation_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97545f4be1d294d5f95ee01229"`,
    );
    await queryRunner.query(`DROP TABLE "quotations"`);
    await queryRunner.query(`DROP TYPE "public"."quotations_event_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3049ba518070dbd8e46d4b5a5b"`,
    );
    await queryRunner.query(`DROP TABLE "quotation_recipients"`);
    await queryRunner.query(`DROP TABLE "quotation_photos"`);
  }
}
