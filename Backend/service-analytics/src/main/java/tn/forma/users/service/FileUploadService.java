package tn.forma.users.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import tn.forma.users.dto.FileUploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileUploadService {

    private final Cloudinary cloudinary;

    private static final long MAX_SIZE       = 10L * 1024 * 1024; // 10 MB
    private static final String[] ALLOWED    = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"};

    // ── Upload methods ─────────────────────────────────────

    public FileUploadResponse uploadAvatar(MultipartFile file) {
        return upload(file, "forma/avatars");
    }

    public FileUploadResponse uploadProjectMedia(MultipartFile file) {
        return upload(file, "forma/media");
    }

    public FileUploadResponse uploadProjectLogo(MultipartFile file) {
        return upload(file, "forma/project-logos");
    }

    public FileUploadResponse uploadDesignAsset(MultipartFile file) {
        return upload(file, "forma/design");
    }

    // ── Delete ─────────────────────────────────────────────

    public void deleteFile(String fileUrl) {
        String publicId = extractPublicId(fileUrl);
        if (publicId != null) {
            deleteByPublicId(publicId);
        }
    }

    public void deleteByPublicId(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted Cloudinary asset: {}", publicId);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to delete file", ex);
        }
    }

    // ── Private helpers ────────────────────────────────────

    private FileUploadResponse upload(MultipartFile file, String folder) {
        validate(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "use_filename", true,
                            "unique_filename", true,
                            "overwrite", true
                    )
            );

            String url = result.get("secure_url") != null
                    ? result.get("secure_url").toString()
                    : result.get("url").toString();
            String publicId = result.get("public_id").toString();

            log.info("File uploaded to Cloudinary: {}", publicId);
            return FileUploadResponse.builder()
                    .url(url)
                    .publicId(publicId)
                    .build();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to upload file", ex);
        }
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

    private String extractPublicId(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank() || !fileUrl.contains("/upload/")) {
            return null;
        }

        String normalized = fileUrl.split("\\?")[0];
        String[] parts = normalized.split("/upload/");
        if (parts.length < 2) {
            return null;
        }

        String path = parts[1].replaceFirst("^v\\d+/", "");
        int extensionIndex = path.lastIndexOf('.');
        if (extensionIndex > 0) {
            path = path.substring(0, extensionIndex);
        }
        return path;
    }
}
