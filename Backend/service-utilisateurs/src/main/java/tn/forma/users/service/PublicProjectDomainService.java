package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.ResolvedPublicProjectDto;
import tn.forma.users.model.Project;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.util.ProjectDomainNormalizer;

@Service
@RequiredArgsConstructor
public class PublicProjectDomainService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public ResolvedPublicProjectDto resolvePublishedProject(String rawHost) {
        String normalizedHost = ProjectDomainNormalizer.normalize(rawHost);
        if (normalizedHost == null) {
            throw new RuntimeException("Published project domain not found");
        }

        Project project = projectRepository.findByDefaultDomainIgnoreCaseAndPublishedTrue(normalizedHost)
                .orElseThrow(() -> new RuntimeException("Published project domain not found"));

        return ResolvedPublicProjectDto.builder()
                .projectId(project.getId())
                .defaultDomain(project.getDefaultDomain())
                .type(project.getType())
                .published(project.isPublished())
                .build();
    }
}
