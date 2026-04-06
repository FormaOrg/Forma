package tn.forma.users.dto;

public enum SalesOrderFilter {
    ALL,
    ACTIVE,
    DELIVERED,
    DUE_ON_DELIVERY;

    public static SalesOrderFilter fromNullable(String value) {
        if (value == null || value.isBlank()) {
            return ALL;
        }

        try {
            return SalesOrderFilter.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ALL;
        }
    }
}
