package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import tn.forma.users.dto.FileUploadResponse;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.service.FileUploadService;
import tn.forma.users.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileUploadService fileUploadService;
    private final UserService userService;

    @PostMapping("/avatar")
    public ResponseEntity<FileUploadResponse> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        String previousAvatarPublicId = userService.getAvatarPublicId(userDetails.getUsername());
        FileUploadResponse upload = fileUploadService.uploadAvatar(file);

        if (previousAvatarPublicId != null && !previousAvatarPublicId.equals(upload.getPublicId())) {
            fileUploadService.deleteByPublicId(previousAvatarPublicId);
        }

        userService.updateAvatar(userDetails.getUsername(), upload.getUrl(), upload.getPublicId());
        upload.setMessage("Avatar uploaded successfully");
        return ResponseEntity.ok(upload);
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<MessageResponse> deleteAvatar(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String avatarPublicId = userService.clearAvatar(userDetails.getUsername());
        if (avatarPublicId != null) {
            fileUploadService.deleteByPublicId(avatarPublicId);
        }
        return ResponseEntity.ok(new MessageResponse("Avatar removed successfully"));
    }

    @PostMapping("/media")
    public ResponseEntity<FileUploadResponse> uploadProjectMedia(
            @RequestParam("file") MultipartFile file
    ) {
        FileUploadResponse upload = fileUploadService.uploadProjectMedia(file);
        upload.setMessage("Media uploaded successfully");
        return ResponseEntity.ok(upload);
    }

    @PostMapping("/design-asset")
    public ResponseEntity<FileUploadResponse> uploadDesignAsset(
            @RequestParam("file") MultipartFile file
    ) {
        FileUploadResponse upload = fileUploadService.uploadDesignAsset(file);
        upload.setMessage("Design asset uploaded successfully");
        return ResponseEntity.ok(upload);
    }

    @DeleteMapping
    public ResponseEntity<MessageResponse> deleteFile(
            @RequestParam("fileUrl") String fileUrl
    ) {
        fileUploadService.deleteFile(fileUrl);
        return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
    }
}
