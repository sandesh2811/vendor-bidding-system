import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPayments1794204753541 implements MigrationInterface {
    name = 'AddPayments1794204753541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'bank_transfer', 'cheque', 'esewa', 'khalti')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "paid_at" date NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "reference" character varying, "note" text, "recorded_by_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_payments_amount_positive" CHECK ("amount" > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "paid_amount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_paid_within_amount" CHECK ("paid_amount" >= 0 AND "paid_amount" <= "amount")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_48f20e5f3bafd282ca876aef968" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_48f20e5f3bafd282ca876aef968"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_paid_within_amount"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "paid_amount"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    }

}
