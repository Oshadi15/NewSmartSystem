package com.campus.backend.repository;

import com.campus.backend.model.Resource;
import com.campus.backend.model.ResourceStatus;
import com.campus.backend.model.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Spring Data MongoDB repository for {@link Resource} entities.
 *communicate with database
 * <p>Complex multi-criteria queries involving combined filters (type + location +
 * capacity + status) are handled in {@link com.campus.hub.service.ResourceService}
 * via {@code MongoTemplate} for maximum flexibility.</p>
 */
public interface ResourceRepository extends MongoRepository<Resource, String> {

    // ── Single-field queries (used as fallback) ───────────────────────────────

    List<Resource> findByType(ResourceType type);

    List<Resource> findByStatus(ResourceStatus status);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    /** Case-sensitive exact match; use MongoTemplate for case-insensitive search. */
    List<Resource> findByLocation(String location);

    // ── Pageable variants ────────────────────────────────────────────────────

    Page<Resource> findAll(Pageable pageable);

    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);

    // ── Existence checks ─────────────────────────────────────────────────────

    /**
     * Used during resource creation to detect duplicates.
     * Name + location combination is treated as a logical unique key.
     */
    boolean existsByNameIgnoreCaseAndLocationIgnoreCase(String name, String location);
}
