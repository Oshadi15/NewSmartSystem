package com.campus.backend.service;

import com.campus.backend.dto.CreateResourceRequest;
import com.campus.backend.dto.PageResponse;
import com.campus.backend.dto.ResourceDTO;
import com.campus.backend.dto.UpdateResourceRequest;
import com.campus.backend.exception.ConflictException;
import com.campus.backend.exception.ResourceNotFoundException;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.Resource;
import com.campus.backend.model.ResourceStatus;
import com.campus.backend.model.ResourceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for the Resource Management module.
 *
 * <p>Design decisions:
 * <ul>
 *   <li>Timestamps are managed by Spring Data auditing ({@code @CreatedDate} /
 *       {@code @LastModifiedDate}) — we do not set them manually.</li>
 *   <li>Multi-criteria filtering uses {@link MongoTemplate} with {@link Criteria}
 *       so all filter params can be applied simultaneously.</li>
 *   <li>Capacity is required for room/lab/lecture-hall types but optional for
 *       EQUIPMENT.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final com.campus.backend.repository.ResourceRepository resourceRepository;
    private final MongoTemplate mongoTemplate;

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Creates a new resource.
     *
     * <p>Validates:
     * <ul>
     *   <li>Capacity is provided for non-EQUIPMENT types</li>
     *   <li>Availability window is valid (startTime &lt; endTime)</li>
     *   <li>No duplicate name + location combination</li>
     * </ul>
     */
    public ResourceDTO createResource(CreateResourceRequest request) {
        log.info("Creating resource: name='{}', type={}, location='{}'",
                request.getName(), request.getType(), request.getLocation());

        // Capacity required for room-type resources
        if (request.getType() != ResourceType.EQUIPMENT && request.getCapacity() == null) {
            throw new ValidationException(
                    "Capacity is required for type " + request.getType());
        }

        // Validate availability window
        if (request.getAvailability() != null && !request.getAvailability().isValid()) {
            throw new ValidationException(
                    "Availability startTime must be before endTime");
        }

        // Duplicate guard: same name in same location
        if (resourceRepository.existsByNameIgnoreCaseAndLocationIgnoreCase(
                request.getName(), request.getLocation())) {
            throw new ConflictException(
                    "A resource named '" + request.getName()
                            + "' already exists at '" + request.getLocation() + "'");
        }

        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .availability(request.getAvailability())
                .status(request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE)
                .build();

        Resource saved = resourceRepository.save(resource);
        log.info("Resource created successfully with id='{}'", saved.getId());
        return mapToDTO(saved);
    }

    // ── READ (single) ─────────────────────────────────────────────────────────

    public ResourceDTO getResource(String id) {
        log.debug("Fetching resource id='{}'", id);
        return mapToDTO(fetchResource(id));
    }

    // ── READ (list — non-paginated) ────────────────────────────────────────

    /**
     * Returns all resources matching the provided filter criteria.
     * All parameters are optional and combinable.
     *
     * @param type          filter by resource type
     * @param minCapacity   filter where capacity &ge; minCapacity
     * @param location      case-insensitive substring match on location
     * @param status        filter by operational status
     */
    public List<ResourceDTO> getAllResources(ResourceType type,
                                             Integer minCapacity,
                                             String location,
                                             ResourceStatus status) {
        Query query = buildQuery(type, minCapacity, location, status);
        query.with(Sort.by(Sort.Direction.ASC, "name"));
        log.debug("Querying resources with type={}, minCapacity={}, location='{}', status={}",
                type, minCapacity, location, status);
        return mongoTemplate.find(query, Resource.class)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ── READ (paginated) ──────────────────────────────────────────────────────

    /**
     * Returns a paginated, filtered view of resources.
     *
     * @param type          optional type filter
     * @param minCapacity   optional minimum capacity filter
     * @param location      optional location substring filter
     * @param status        optional status filter
     * @param page          zero-based page index
     * @param size          page size (max 100, capped to avoid abuse)
     * @param sortBy        field to sort by (default: "name")
     * @param sortDir       sort direction: "asc" or "desc"
     */
    public PageResponse<ResourceDTO> getResourcesPage(ResourceType type,
                                                      Integer minCapacity,
                                                      String location,
                                                      ResourceStatus status,
                                                      int page,
                                                      int size,
                                                      String sortBy,
                                                      String sortDir) {
        int safeSize = Math.min(size, 100);
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, safeSize, Sort.by(direction, sortBy));

        Query query = buildQuery(type, minCapacity, location, status);
        query.with(pageable);

        List<Resource> items = mongoTemplate.find(query, Resource.class);
        long total = mongoTemplate.count(buildQuery(type, minCapacity, location, status), Resource.class);

        Page<Resource> pageResult = PageableExecutionUtils.getPage(items, pageable, () -> total);
        List<ResourceDTO> dtos = pageResult.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        log.debug("Paginated resource query — page={}, size={}, total={}", page, safeSize, total);

        return PageResponse.<ResourceDTO>builder()
                .content(dtos)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    /**
     * Partially updates a resource (patch semantics — only non-null fields applied).
     */
    public ResourceDTO updateResource(String id, UpdateResourceRequest request) {
        log.info("Updating resource id='{}'", id);
        Resource resource = fetchResource(id);

        if (request.getName() != null)         resource.setName(request.getName());
        if (request.getType() != null)         resource.setType(request.getType());
        if (request.getCapacity() != null)     resource.setCapacity(request.getCapacity());
        if (request.getLocation() != null)     resource.setLocation(request.getLocation());
        if (request.getStatus() != null)       resource.setStatus(request.getStatus());

        if (request.getAvailability() != null) {
            if (!request.getAvailability().isValid()) {
                throw new ValidationException("Availability startTime must be before endTime");
            }
            resource.setAvailability(request.getAvailability());
        }

        Resource updated = resourceRepository.save(resource);
        log.info("Resource id='{}' updated — status={}", updated.getId(), updated.getStatus());
        return mapToDTO(updated);
    }

    // ── STATUS CHANGE shortcut ────────────────────────────────────────────────

    /**
     * Convenience method to toggle a resource between ACTIVE and OUT_OF_SERVICE.
     * Used by the admin UI buttons without needing a full update payload.
     */
    public ResourceDTO setStatus(String id, ResourceStatus newStatus) {
        log.info("Setting resource id='{}' status to {}", id, newStatus);
        Resource resource = fetchResource(id);
        resource.setStatus(newStatus);
        return mapToDTO(resourceRepository.save(resource));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    /**
     * Permanently deletes a resource.
     *
     * <p>Note: orphaned bookings referencing this resource are NOT cleaned up here.
     * Consider adding a cascade step if booking data integrity is required.</p>
     */
    public void deleteResource(String id) {
        log.info("Deleting resource id='{}'", id);
        Resource resource = fetchResource(id);
        resourceRepository.delete(resource);
        log.info("Resource id='{}' deleted", id);
    }

    // ── INTERNAL HELPERS ─────────────────────────────────────────────────────

    /**
     * Fetches a resource by id, throwing {@link ResourceNotFoundException} if absent.
     */
    protected Resource fetchResource(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with id: " + id));
    }

    /**
     * Builds a {@link Query} from optional filter parameters.
     * All non-null params are combined (AND logic).
     */
    private Query buildQuery(ResourceType type,
                             Integer minCapacity,
                             String location,
                             ResourceStatus status) {
        List<Criteria> criteriaList = new ArrayList<>();

        if (type != null) {
            criteriaList.add(Criteria.where("type").is(type));
        }
        if (minCapacity != null) {
            criteriaList.add(Criteria.where("capacity").gte(minCapacity));
        }
        if (location != null && !location.isBlank()) {
            // Case-insensitive substring match
            criteriaList.add(Criteria.where("location").regex(location, "i"));
        }
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        Query query = new Query();
        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }
        return query;
    }

    /**
     * Maps a {@link Resource} entity to its {@link ResourceDTO} representation.
     */
    private ResourceDTO mapToDTO(Resource resource) {
        ResourceDTO dto = new ResourceDTO();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setAvailability(resource.getAvailability());
        dto.setStatus(resource.getStatus());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());
        dto.setBookable(resource.isBookable());
        return dto;
    }
}
