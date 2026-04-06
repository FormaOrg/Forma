package tn.forma.users.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import tn.forma.users.dto.FileUploadResponse;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.service.FileUploadService;
import tn.forma.users.service.ProjectService;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileUploadService fileUploadService;
    private final ProjectService projectService;

    @PostMapping("/projects/{projectId}/logo")
    public ResponseEntity<FileUploadResponse> uploadProjectLogo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) {
        String previousLogoPublicId = projectService.getProjectLogoPublicId(userDetails.getUsername(), projectId);
        FileUploadResponse upload = fileUploadService.uploadProjectLogo(file);

        if (previousLogoPublicId != null && !previousLogoPublicId.equals(upload.getPublicId())) {
            fileUploadService.deleteByPublicId(previousLogoPublicId);
        }

        projectService.updateProjectLogo(userDetails.getUsername(), projectId, upload.getUrl(), upload.getPublicId());
        upload.setMessage("Project logo uploaded successfully");
        return ResponseEntity.ok(upload);
    }

    @DeleteMapping("/projects/{projectId}/logo")
    public ResponseEntity<MessageResponse> deleteProjectLogo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId
    ) {
        String logoPublicId = projectService.clearProjectLogo(userDetails.getUsername(), projectId);
        if (logoPublicId != null) {
            fileUploadService.deleteByPublicId(logoPublicId);
        }
        return ResponseEntity.ok(new MessageResponse("Project logo removed successfully"));
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
