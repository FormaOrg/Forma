package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.forma.users.dto.ProjectBlogCategoryDto;
import tn.forma.users.dto.ProjectBlogPostDto;
import tn.forma.users.dto.ProjectBlogSubscriberDto;
import tn.forma.users.model.Project;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProjectBlogWorkspaceService {

    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<ProjectBlogPostDto> getPosts(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        String updatedLabel = formatShortDate(project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt());
        String projectName = normalizeProjectName(project.getName());

        return List.of(
                new ProjectBlogPostDto(
                        "launch-story",
                        "How to launch a sharper editorial voice in 30 days",
                        "A practical publishing plan inspired by the positioning behind " + projectName + ".",
                        "published",
                        "Published",
                        "Strategy",
                        "6 min read",
                        "1.8k views",
                        updatedLabel,
                        "Turn your blog into a consistent point of view instead of a list of updates.",
                        "Launch a sharper editorial voice in 30 days",
                        "Newsletter and homepage feature"
                ),
                new ProjectBlogPostDto(
                        "workflow-stack",
                        "The content workflow stack our team actually sticks to",
                        "The templates, review rules, and publishing cadence that keep content shipping each week.",
                        "scheduled",
                        "Scheduled",
                        "Operations",
                        "4 min read",
                        "Queued for Tuesday",
                        updatedLabel,
                        "A practical view of the writing pipeline from outline to publish.",
                        "The content workflow stack teams actually stick to",
                        "Scheduled for email and social"
                ),
                new ProjectBlogPostDto(
                        "design-systems",
                        "Design systems that help writers move faster",
                        "Why reusable blocks and content patterns matter just as much as visual consistency.",
                        "draft",
                        "Draft",
                        "Design",
                        "7 min read",
                        "Draft in review",
                        updatedLabel,
                        "Better structure means less friction when writers need to publish quickly.",
                        "Design systems that help writers publish faster",
                        "Internal review only"
                ),
                new ProjectBlogPostDto(
                        "audience-signals",
                        "What early subscriber signals are worth paying attention to",
                        "A short guide to judging traction before your list is large.",
                        "published",
                        "Published",
                        "Growth",
                        "5 min read",
                        "940 views",
                        updatedLabel,
                        "Use replies, saves, and repeat opens to find what readers actually want more of.",
                        "Which early subscriber signals actually matter",
                        "Newsletter and archive"
                )
        );
    }

    public List<ProjectBlogCategoryDto> getCategories(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        String projectName = normalizeProjectName(project.getName());

        return List.of(
                new ProjectBlogCategoryDto(
                        "strategy",
                        "Strategy",
                        projectName + " uses this pillar for positioning, editorial point of view, and practical thinking pieces.",
                        "Core pillar",
                        8,
                        2,
                        "34% of all traffic",
                        "healthy",
                        "Healthy",
                        "Weekly",
                        "Publish a follow-up on content planning cycles."
                ),
                new ProjectBlogCategoryDto(
                        "operations",
                        "Operations",
                        "Document the systems, workflows, and behind-the-scenes mechanics that support the brand.",
                        "Support pillar",
                        5,
                        1,
                        "22% of all traffic",
                        "expanding",
                        "Expanding",
                        "Twice a month",
                        "Turn the content review checklist into a tactical article."
                ),
                new ProjectBlogCategoryDto(
                        "design",
                        "Design",
                        "Use design-led stories to connect structure, usability, and taste with outcomes.",
                        "Visual pillar",
                        4,
                        2,
                        "18% of all traffic",
                        "expanding",
                        "Expanding",
                        "Twice a month",
                        "Package a post around component systems for editorial teams."
                ),
                new ProjectBlogCategoryDto(
                        "growth",
                        "Growth",
                        "Cover audience signals, subscriber health, and what helps the archive compound over time.",
                        "Audience pillar",
                        3,
                        1,
                        "11% of all traffic",
                        "light",
                        "Light coverage",
                        "Monthly",
                        "Write a piece on retention signals beyond open rate."
                )
        );
    }

    public List<ProjectBlogSubscriberDto> getSubscribers(String email, Long projectId) {
        getOwnedProject(email, projectId);

        return List.of(
                new ProjectBlogSubscriberDto(
                        1L,
                        "Lina Rahal",
                        "lina@northnote.co",
                        "vip",
                        "VIP reader",
                        "Homepage form",
                        "Editorial strategy",
                        "Joined this month",
                        "82% open rate",
                        "Replied yesterday"
                ),
                new ProjectBlogSubscriberDto(
                        2L,
                        "Youssef Karray",
                        "youssef@letters.studio",
                        "engaged",
                        "Engaged",
                        "Lead magnet",
                        "Content ops",
                        "Joined 3 weeks ago",
                        "61% open rate",
                        "Clicked Monday issue"
                ),
                new ProjectBlogSubscriberDto(
                        3L,
                        "Meriem B.",
                        "meriem@craftmemo.com",
                        "new",
                        "New",
                        "Article inline form",
                        "Design systems",
                        "Joined today",
                        "Awaiting first send",
                        "No activity yet"
                ),
                new ProjectBlogSubscriberDto(
                        4L,
                        "Sami Ferchichi",
                        "sami@archive.school",
                        "paused",
                        "Paused",
                        "Import",
                        "Growth",
                        "Joined 2 months ago",
                        "12% open rate",
                        "Needs re-engagement"
                )
        );
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private String normalizeProjectName(String value) {
        if (value == null || value.isBlank()) {
            return "your publication";
        }

        return value.trim();
    }

    private String formatShortDate(LocalDateTime value) {
        if (value == null) {
            return "Recently updated";
        }

        return SHORT_DATE.format(value);
    }
}
