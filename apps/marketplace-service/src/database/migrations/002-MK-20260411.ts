import { MigrationInterface, QueryRunner } from 'typeorm';

export class MK002SeedCategories1775883699290 implements MigrationInterface {
    name = 'MK002SeedCategories1775883699290';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed parent categories
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId") VALUES
                ('Electronics', NULL),
                ('Books & Study Materials', NULL),
                ('Clothing & Accessories', NULL),
                ('Furniture & Household', NULL),
                ('Sports & Outdoors', NULL),
                ('Other', NULL)`,
        );

        // Seed subcategories — Electronics
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Phones'), ('Laptops & Computers'), ('Tablets'), ('Audio & Headphones'), ('Cameras & Photography')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Electronics'`,
        );

        // Books & Study Materials
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Textbooks'), ('Notes & Study Guides'), ('Stationery & Supplies')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Books & Study Materials'`,
        );

        // Clothing & Accessories
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Men''s Clothing'), ('Women''s Clothing'), ('Bags & Backpacks'), ('Shoes')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Clothing & Accessories'`,
        );

        // Furniture & Household
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Furniture'), ('Kitchen & Dining'), ('Bedding & Décor')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Furniture & Household'`,
        );

        // Sports & Outdoors
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Sports Equipment'), ('Bicycles'), ('Outdoor Gear')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Sports & Outdoors'`,
        );

        // Other
        await queryRunner.query(
            `INSERT INTO "marketplace_categories" ("name", "parentId")
             SELECT sub.name, p.id FROM
             (VALUES ('Miscellaneous')) AS sub(name)
             JOIN "marketplace_categories" p ON p.name = 'Other'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "marketplace_categories"`);
    }
}
