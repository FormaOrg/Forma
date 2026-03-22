package tn.forma.users.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${application.upload.dir:uploads}")
    private String uploadDir;

    @Value("${application.frontend-url}")
    private String baseUrl;

    private static final long MAX_SIZE       = 10L * 1024 * 1024; // 10 MB
    private static final String[] ALLOWED    = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"};

    // ── Upload methods ─────────────────────────────────────

    public String uploadAvatar(MultipartFile file) throws IOException {
        return upload(file, "avatars");
    }

    public String uploadProjectMedia(MultipartFile file) throws IOException {
        return upload(file, "media");
    }

    public String uploadDesignAsset(MultipartFile file) throws IOException {
        return upload(file, "design");
    }

    // ── Delete ─────────────────────────────────────────────

    public void deleteFile(String fileUrl) throws IOException {
        // Extract relative path from URL
        String relativePath = fileUrl.replace(baseUrl + "/uploads/", "");
        Path path = Paths.get(uploadDir).resolve(relativePath);

        if (Files.exists(path)) {
            Files.delete(path);
            log.info("Deleted file: {}", path);
        }
    }

    // ── Private helpers ────────────────────────────────────

    private String upload(MultipartFile file, String folder) throws IOException {
        validate(file);

        // Create folder if it doesn't exist
        Path folderPath = Paths.get(uploadDir, folder);
        Files.createDirectories(folderPath);

        // Generate unique filename
        String extension = getExtension(file.getOriginalFilename());
        String filename  = UUID.randomUUID() + "." + extension;
        Path filePath    = folderPath.resolve(filename);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("File uploaded: {}", filePath);

        // Return accessible URL
        return baseUrl + "/uploads/" + folder + "/" + filename;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File must be under 10MB");
        }

        String contentType = file.getContentType();
        boolean allowed = false;
        for (String type : ALLOWED) {
            if (type.equals(contentType)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP and GIF are allowed");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }
}