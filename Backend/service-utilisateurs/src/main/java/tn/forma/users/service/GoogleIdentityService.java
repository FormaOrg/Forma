package tn.forma.users.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleIdentityService {

    @Value("${application.google.client-id:}")
    private String googleClientId;

    public String getClientId() {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google sign-in is not configured");
        }
        return googleClientId;
    }

    public GoogleIdToken.Payload verifyIdToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(getClientId()))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new RuntimeException("Invalid Google sign-in token");
            }

            return googleIdToken.getPayload();
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Google token verification failed", ex);
            throw new RuntimeException("Google sign-in failed. Please try again.");
        }
    }
}
