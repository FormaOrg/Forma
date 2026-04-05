package tn.forma.users.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaConstraintConfiguration {

    @Bean
    ApplicationRunner projectOrderItemsProductConstraintRunner(JdbcTemplate jdbcTemplate) {
        return args -> jdbcTemplate.execute("""
                DO $$
                BEGIN
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
                END $$;
                """);
    }
}
