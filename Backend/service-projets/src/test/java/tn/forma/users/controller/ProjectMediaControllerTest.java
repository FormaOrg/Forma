package tn.forma.users.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;
import tn.forma.users.dto.ImportProjectMediaRequest;
import tn.forma.users.dto.ProjectMediaDto;
import tn.forma.users.exception.GlobalExceptionHandler;
import tn.forma.users.model.ProjectMediaType;
import tn.forma.users.service.ProjectMediaService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectMediaControllerTest {

    @Mock
    private ProjectMediaService projectMediaService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UsernamePasswordAuthenticationToken authentication;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        ProjectMediaController controller = new ProjectMediaController(projectMediaService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        authentication = new UsernamePasswordAuthenticationToken(
                User.withUsername("owner@forma.test").password("secret").roles("USER").build(),
                null
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getProjectMediaReturnsOwnedAssets() throws Exception {
        when(projectMediaService.getProjectMedia("owner@forma.test", 49L)).thenReturn(List.of(
                ProjectMediaDto.builder()
                        .id(10L)
                        .projectId(49L)
                        .fileName("hero.jpg")
                        .fileUrl("https://cdn.example.com/hero.jpg")
                        .type(ProjectMediaType.IMAGE)
                        .fileSize(1200L)
                        .uploadedAt("2026-04-08T00:00:00")
                        .build()
        ));

        mockMvc.perform(get("/api/projects/49/media"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fileName").value("hero.jpg"))
                .andExpect(jsonPath("$[0].type").value("IMAGE"));
    }

    @Test
    void uploadProjectMediaDelegatesMultipartFileToService() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "banner.png", "image/png", new byte[]{1, 2, 3});

        when(projectMediaService.uploadProjectMedia(eq("owner@forma.test"), eq(49L), any(MultipartFile.class)))
                .thenReturn(ProjectMediaDto.builder()
                        .id(15L)
                        .projectId(49L)
                        .fileName("banner.png")
                        .fileUrl("https://cdn.example.com/banner.png")
                        .type(ProjectMediaType.IMAGE)
                        .fileSize(2048L)
                        .uploadedAt("2026-04-08T00:05:00")
                        .build());

        mockMvc.perform(multipart("/api/projects/49/media")
                        .file(file)
                        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(15))
                .andExpect(jsonPath("$.fileUrl").value("https://cdn.example.com/banner.png"));
    }

    @Test
    void importProjectMediaReturnsBadRequestForInvalidBody() throws Exception {
        ImportProjectMediaRequest request = new ImportProjectMediaRequest();
        request.setSourceUrl("");

        mockMvc.perform(post("/api/projects/49/media/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.sourceUrl").exists());
    }

    @Test
    void importProjectMediaDelegatesToService() throws Exception {
        ImportProjectMediaRequest request = new ImportProjectMediaRequest();
        request.setSourceUrl("https://images.pexels.com/photos/123/pexels-photo.jpeg");
        request.setFileName("pexels-photo.jpeg");

        when(projectMediaService.importProjectMedia(eq("owner@forma.test"), eq(49L), any(ImportProjectMediaRequest.class)))
                .thenReturn(ProjectMediaDto.builder()
                        .id(99L)
                        .projectId(49L)
                        .fileName("pexels-photo.jpeg")
                        .fileUrl("https://res.cloudinary.com/demo/image/upload/v1/forma/media/pexels-photo.jpeg")
                        .type(ProjectMediaType.IMAGE)
                        .fileSize(0L)
                        .uploadedAt("2026-04-08T00:10:00")
                        .build());

        mockMvc.perform(post("/api/projects/49/media/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.fileName").value("pexels-photo.jpeg"));
    }

    @Test
    void deleteProjectMediaReturnsSuccessMessage() throws Exception {
        mockMvc.perform(delete("/api/projects/49/media/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Media deleted successfully"));

        verify(projectMediaService).deleteProjectMedia("owner@forma.test", 49L, 15L);
    }
}
