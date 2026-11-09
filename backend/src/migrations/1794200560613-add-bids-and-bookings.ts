import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBidsAndBookings1794200560613 implements MigrationInterface {
    name = 'AddBidsAndBookings1794200560613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bids_status_enum" AS ENUM('submitted', 'selected', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "bids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "vendor_id" uuid NOT NULL, "status" "public"."bids_status_enum" NOT NULL DEFAULT 'submitted', "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "valid_until" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_bids_quotation_vendor" UNIQUE ("quotation_id", "vendor_id"), CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bid_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bid_id" uuid NOT NULL, "quotation_item_id" uuid NOT NULL, "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL, CONSTRAINT "UQ_bid_items_bid_quotation_item" UNIQUE ("bid_id", "quotation_item_id"), CONSTRAINT "CHK_bid_items_unit_price_non_negative" CHECK ("unit_price" >= 0), CONSTRAINT "PK_2989cf4a2a6227ee735f2cf8811" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('confirmed', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "bid_id" uuid NOT NULL, "vendor_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'confirmed', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_bookings_bid" UNIQUE ("bid_id"), CONSTRAINT "UQ_bookings_quotation" UNIQUE ("quotation_id"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."quotations_status_enum" AS ENUM('draft', 'open', 'closed', 'awarded', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "quotations" ADD "status" "public"."quotations_status_enum" NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_a7cb4bf6980f4fbf6e1b99b735d" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_848c65fd1726ea9095e5f6cc79c" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid_items" ADD CONSTRAINT "FK_7d057e2c0bd80abd3f5a13a56da" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid_items" ADD CONSTRAINT "FK_7ff3b401662e31d81e33e2e90db" FOREIGN KEY ("quotation_item_id") REFERENCES "quotation_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_fae6b38cab5959cf354ebe6d50f" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_b57f48110fe5fda0e519a68f033" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_0356b37bc1a2100608a4dfdab92" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_0356b37bc1a2100608a4dfdab92"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_b57f48110fe5fda0e519a68f033"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_fae6b38cab5959cf354ebe6d50f"`);
        await queryRunner.query(`ALTER TABLE "bid_items" DROP CONSTRAINT "FK_7ff3b401662e31d81e33e2e90db"`);
        await queryRunner.query(`ALTER TABLE "bid_items" DROP CONSTRAINT "FK_7d057e2c0bd80abd3f5a13a56da"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_848c65fd1726ea9095e5f6cc79c"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_a7cb4bf6980f4fbf6e1b99b735d"`);
        await queryRunner.query(`ALTER TABLE "quotations" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."quotations_status_enum"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "bid_items"`);
        await queryRunner.query(`DROP TABLE "bids"`);
        await queryRunner.query(`DROP TYPE "public"."bids_status_enum"`);
    }

}
