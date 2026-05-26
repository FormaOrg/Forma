package tn.forma.users.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaConstraintConfiguration {

    @Bean
    ApplicationRunner projectOrderItemsProductConstraintRunner(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF to_regclass('public.project_order_items') IS NOT NULL
                       AND to_regclass('public.project_products') IS NOT NULL THEN
                        ALTER TABLE project_order_items
                            DROP CONSTRAINT IF EXISTS fk4qftuxsajsmsui316pcsxe4sd;

                        ALTER TABLE project_order_items
                            DROP CONSTRAINT IF EXISTS fk_project_order_items_product;

                        ALTER TABLE project_order_items
                            ADD CONSTRAINT fk_project_order_items_product
                            FOREIGN KEY (product_id)
                            REFERENCES project_products(id)
                            ON UPDATE CASCADE
                            ON DELETE CASCADE;
                    END IF;
                END $$;
                """);

            jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF to_regclass('public.project_products') IS NOT NULL THEN
                        PERFORM setval(
                            pg_get_serial_sequence('project_products', 'id'),
                            COALESCE((SELECT MAX(id) FROM project_products), 1),
                            (SELECT COUNT(*) > 0 FROM project_products)
                        );
                    END IF;
                END $$;
                """);
        };
    }
}
