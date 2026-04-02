package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.Template;

import java.util.List;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {
    List<Template> findAllByOwnerIsNullOrOwnerIdOrderByFeaturedDescUpdatedAtDesc(Long ownerId);
}
