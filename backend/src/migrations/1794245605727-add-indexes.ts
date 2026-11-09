import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1794245605727 implements MigrationInterface {
    name = 'AddIndexes1794245605727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quotation_recipients" ADD "viewed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "quotation_recipients" ADD "declined_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "quotation_recipients" ADD "decline_reason" text`);
        await queryRunner.query(`CREATE INDEX "IDX_bids_vendor_id" ON "bids"  ("vendor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_payments_booking_id" ON "payments"  ("booking_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bookings_vendor_id" ON "bookings"  ("vendor_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_bookings_vendor_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_booking_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bids_vendor_id"`);
        await queryRunner.query(`ALTER TABLE "quotation_recipients" DROP COLUMN "decline_reason"`);
        await queryRunner.query(`ALTER TABLE "quotation_recipients" DROP COLUMN "declined_at"`);
        await queryRunner.query(`ALTER TABLE "quotation_recipients" DROP COLUMN "viewed_at"`);
    }

}
