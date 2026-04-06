package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import tn.forma.users.dto.PortfolioPageDto;
import tn.forma.users.dto.PortfolioPagesPageDto;
import tn.forma.users.model.PortfolioPage;
import tn.forma.users.model.PortfolioPageStatus;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.PortfolioPageRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioPageService {

    private final PlatformTransactionManager transactionManager;
    private final PortfolioPageRepository portfolioPageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public PortfolioPagesPageDto getPagesPage(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        List<PortfolioPage> pages = ensureDefaultPages(project);

        return PortfolioPagesPageDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .pages(pages.stream().map(this::mapToDto).toList())
                .build();
    }

    public List<PortfolioPage> ensureDefaultPages(Project project) {
        if (project.getType() != ProjectType.PORTFOLIO) {
            return List.of();
        }

        List<PortfolioPage> existingPages = portfolioPageRepository.findAllByProjectIdOrderBySortOrderAsc(project.getId());
        if (!existingPages.isEmpty()) {
            return existingPages;
        }

        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transactionTemplate.setReadOnly(false);

        return transactionTemplate.execute(status -> {
            List<PortfolioPage> pages = portfolioPageRepository.findAllByProjectIdOrderBySortOrderAsc(project.getId());
            if (!pages.isEmpty()) {
                return pages;
            }

            List<PortfolioPage> seededPages = List.of(
                    PortfolioPage.builder()
                            .project(project)
                            .title("Home")
                            .slug("/")
                            .description("Lead with " + project.getName() + ", your headline work, and a clear first impression.")
                            .status(PortfolioPageStatus.PUBLISHED)
                            .sectionCount(6)
                            .seoLabel("Optimized")
                            .featured(true)
                            .sortOrder(0)
                            .build(),
                    PortfolioPage.builder()
                            .project(project)
                            .title("About")
                            .slug("/about")
                            .description("Tell your story, process, and experience in a way that supports your positioning.")
                            .status(PortfolioPageStatus.PUBLISHED)
                            .sectionCount(4)
                            .seoLabel("Healthy")
                            .featured(false)
                            .sortOrder(1)
                            .build(),
                    PortfolioPage.builder()
                            .project(project)
                            .title("Projects")
                            .slug("/projects")
                            .description("Show selected case studies, visuals, and the outcome behind each client or personal piece.")
                            .status(PortfolioPageStatus.IN_PROGRESS)
                            .sectionCount(5)
                            .seoLabel("Needs meta copy")
                            .featured(false)
                            .sortOrder(2)
                            .build(),
                    PortfolioPage.builder()
                            .project(project)
                            .title("Contact")
                            .slug("/contact")
                            .description("Collect inquiries with a focused contact page and the right call to action.")
                            .status(PortfolioPageStatus.DRAFT)
                            .sectionCount(3)
                            .seoLabel("Not reviewed")
                            .featured(false)
                            .sortOrder(3)
                            .build()
            );

            return portfolioPageRepository.saveAll(seededPages).stream()
                    .sorted(java.util.Comparator.comparingInt(PortfolioPage::getSortOrder))
                    .toList();
        });
    }

    @Transactional
    public void deletePagesForProject(Long projectId) {
        portfolioPageRepository.deleteAllByProjectId(projectId);
    }

    private PortfolioPageDto mapToDto(PortfolioPage page) {
        return PortfolioPageDto.builder()
                .id(page.getId())
                .title(page.getTitle())
                .slug(page.getSlug())
                .description(page.getDescription())
                .status(page.getStatus().name().toLowerCase())
                .statusLabel(switch (page.getStatus()) {
                    case PUBLISHED -> "Published";
                    case IN_PROGRESS -> "In progress";
                    case DRAFT -> "Draft";
                })
                .sectionCount(page.getSectionCount())
                .seoLabel(page.getSeoLabel())
                .updatedAt(Objects.toString(page.getUpdatedAt(), null))
                .featured(page.isFeatured())
                .build();
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }
}
