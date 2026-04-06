package tn.forma.users.dto;

public enum SalesOrderSort {
    PLACED_AT_DESC,
    PLACED_AT_ASC,
    TOTAL_DESC,
    TOTAL_ASC;

    public static SalesOrderSort fromNullable(String value) {
        if (value == null || value.isBlank()) {
            return PLACED_AT_DESC;
        }

        try {
            return SalesOrderSort.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PLACED_AT_DESC;
        }
    }
}
