package tn.forma.users.util;

import java.net.IDN;
import java.net.URI;
import java.util.Locale;

public final class ProjectDomainNormalizer {

    private ProjectDomainNormalizer() {
    }

    public static String normalize(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        String trimmed = rawValue.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        String candidate = trimmed.contains("://") ? trimmed : "https://" + trimmed;

        try {
            URI uri = URI.create(candidate);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return null;
            }

            String normalized = IDN.toASCII(host)
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("\\.+$", "");

            return normalized.isBlank() ? null : normalized;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
