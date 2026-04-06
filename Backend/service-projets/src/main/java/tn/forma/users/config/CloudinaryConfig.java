package tn.forma.users.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(
            @Value("${application.cloudinary.cloud-name}") String cloudName,
            @Value("${application.cloudinary.api-key}") String apiKey,
            @Value("${application.cloudinary.api-secret}") String apiSecret
    ) {
        Cloudinary cloudinary = new Cloudinary(Map.of(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        cloudinary.config.secure = true;
        return cloudinary;
    }
}
