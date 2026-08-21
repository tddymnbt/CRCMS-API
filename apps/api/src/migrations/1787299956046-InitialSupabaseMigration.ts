import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSupabaseMigration1787299956046
  implements MigrationInterface
{
  name = 'InitialSupabaseMigration1787299956046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sale_layaways" ("id" SERIAL NOT NULL, "sale_ext_id" character varying(100) NOT NULL, "no_of_months" integer NOT NULL, "amount_due" numeric NOT NULL, "payment_date" TIMESTAMP, "current_due_date" TIMESTAMP NOT NULL, "orig_due_date" TIMESTAMP NOT NULL, "is_extended" boolean NOT NULL DEFAULT false, "status" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), CONSTRAINT "PK_1c88f5c549819eeb4427f8e62ec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_items" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "sale_ext_id" character varying(100) NOT NULL, "product_ext_id" character varying(100) NOT NULL, "qty" integer NOT NULL, "unit_price" numeric NOT NULL, "subtotal" numeric NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_534cb3df276d77c81b1234c02b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" SERIAL NOT NULL, "user_ext_id" character varying(50) NOT NULL, "module" character varying(100), "action" text, "description" text, "ref_id" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_otp_logs" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "token" character varying, "otp" character varying NOT NULL, "date_requested" TIMESTAMP NOT NULL DEFAULT now(), "date_validated" TIMESTAMP, "is_used" boolean NOT NULL DEFAULT false, "is_expired" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_90305fa69c30cec3530167300c5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_authentications" ("id" SERIAL NOT NULL, "user_ext_id" character varying NOT NULL, "token" character varying NOT NULL, "token_jti" character varying NOT NULL, "token_expiry" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, CONSTRAINT "PK_5357fb1162b50b926c77290c8bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "modules" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("id" SERIAL NOT NULL, "role_id" integer NOT NULL, "module_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" SERIAL NOT NULL, "user_id" character varying NOT NULL, "role_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_b23c65e50a758245a33ee35fda" UNIQUE ("role_id"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "external_id" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "last_login" character varying, CONSTRAINT "UQ_11fc776e0ca3573dc195670f636" UNIQUE ("external_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "client_ext_id" character varying(100) NOT NULL, "type" character varying(1) NOT NULL, "total_amount" numeric NOT NULL, "is_discounted" boolean NOT NULL DEFAULT true, "discount_percent" numeric NOT NULL DEFAULT '0', "discount_flat_rate" numeric NOT NULL DEFAULT '0', "date_purchased" TIMESTAMP NOT NULL, "status" character varying(10000) NOT NULL, "images" character varying array, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "cancelled_at" TIMESTAMP, "cancelled_by" character varying(100), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_logs" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "sale_ext_id" character varying(100) NOT NULL, "amount" numeric NOT NULL, "payment_date" TIMESTAMP NOT NULL, "payment_method" character varying(100) NOT NULL, "is_deposit" boolean NOT NULL, "is_final_payment" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_b5bda25324e539ea41bc09697f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stocks" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "product_ext_id" character varying(100) NOT NULL, "is_consigned" boolean NOT NULL DEFAULT false, "consigned_date" TIMESTAMP, "min_qty" integer NOT NULL DEFAULT '0', "avail_qty" integer NOT NULL DEFAULT '0', "sold_qty" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "stock_ext_id" character varying(100) NOT NULL, "type" character varying(100) NOT NULL, "source" character varying(100) NOT NULL, "qty_before" integer NOT NULL, "qty_change" integer NOT NULL, "qty_after" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "category_ext_id" character varying(10000) NOT NULL, "brand_ext_id" character varying(10000) NOT NULL, "external_id" character varying(10000) NOT NULL, "name" character varying(10000) NOT NULL, "material" character varying(10000), "hardware" character varying(10000), "code" character varying(10000), "measurement" character varying(10000), "model" character varying(10000), "auth_ext_id" character varying(10000), "inclusion" character varying array, "images" character varying array, "condition_ext_id" character varying(10000) NOT NULL, "cost" numeric NOT NULL, "price" numeric NOT NULL, "is_consigned" boolean NOT NULL DEFAULT false, "consignor_ext_id" character varying(10000), "consignor_selling_price" numeric, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(10000) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(10000), "deleted_at" TIMESTAMP, "deleted_by" character varying(10000), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_conditions" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "product_ext_id" character varying(100) NOT NULL, "interior" text, "exterior" text, "overall" text, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_9bb389f7657797db59c54b2e8c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_brands" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_f2b98a8f25bd37b19c8356ec659" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_authenticators" ("id" SERIAL NOT NULL, "external_id" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_5f680fa4e0a6a198add5893e17e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_bank_details" ("id" SERIAL NOT NULL, "client_ext_id" character varying(10) NOT NULL, "account_name" character varying(1000) NOT NULL, "account_no" character varying(1000) NOT NULL, "bank" character varying(1000) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_baf8063c572aa45d4b7925072ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" SERIAL NOT NULL, "external_id" character varying(10) NOT NULL, "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "suffix" character varying(10), "birth_date" TIMESTAMP WITH TIME ZONE NOT NULL, "email" character varying(100) NOT NULL, "contact_no" character varying(100), "address" text, "instagram" character varying(100), "facebook" character varying(100), "is_consignor" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying(100) NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" character varying(100), "deleted_at" TIMESTAMP, "deleted_by" character varying(100), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_33ef891a682b47fb3f168c5776a" FOREIGN KEY ("user_ext_id") REFERENCES "users"("external_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_otp_logs" ADD CONSTRAINT "FK_678cde2258c3a45d73f86127fce" FOREIGN KEY ("email") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_authentications" ADD CONSTRAINT "FK_5b1a60836f9c81cceee4c97038a" FOREIGN KEY ("user_ext_id") REFERENCES "users"("external_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_2e0c5c1b40a4137a80930b3b65e" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("external_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_2e0c5c1b40a4137a80930b3b65e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_authentications" DROP CONSTRAINT "FK_5b1a60836f9c81cceee4c97038a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_otp_logs" DROP CONSTRAINT "FK_678cde2258c3a45d73f86127fce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_33ef891a682b47fb3f168c5776a"`,
    );
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TABLE "client_bank_details"`);
    await queryRunner.query(`DROP TABLE "product_authenticators"`);
    await queryRunner.query(`DROP TABLE "product_brands"`);
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "product_conditions"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TABLE "stocks"`);
    await queryRunner.query(`DROP TABLE "payment_logs"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`DROP TABLE "user_authentications"`);
    await queryRunner.query(`DROP TABLE "user_otp_logs"`);
    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(`DROP TABLE "sales_items"`);
    await queryRunner.query(`DROP TABLE "sale_layaways"`);
  }
}
