package com.campus.backend.repository;

import com.campus.backend.model.Ticket;
import com.campus.backend.model.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    List<Ticket> findByReporterIdOrderByCreatedAtDesc(String reporterId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByAssignedTo(String assignedTo);

    List<Ticket> findByStatus(TicketStatus status);

    long countByStatus(TicketStatus status);
}
