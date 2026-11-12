import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorPaymentDetails1794463700562 implements MigrationInterface {
  name = 'AddVendorPaymentDetails1794463700562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vendor_payment_details" ("vendor_id" uuid NOT NULL, "bank_name" character varying, "account_name" character varying, "account_number" character varying, "branch" character varying, "qr_storage_key" character varying, "qr_mime_type" character varying, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_vendor_payment_details_bank_complete" CHECK (("bank_name" IS NULL AND "account_name" IS NULL AND "account_number" IS NULL) OR ("bank_name" IS NOT NULL AND "account_name" IS NOT NULL AND "account_number" IS NOT NULL)), CONSTRAINT "PK_962bcb02b3c68c02f65c6b28e09" PRIMARY KEY ("vendor_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_payment_details" ADD CONSTRAINT "FK_962bcb02b3c68c02f65c6b28e09" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_payment_details" DROP CONSTRAINT "FK_962bcb02b3c68c02f65c6b28e09"`,
    );
    await queryRunner.query(`DROP TABLE "vendor_payment_details"`);
  }
}
