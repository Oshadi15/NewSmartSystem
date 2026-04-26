package com.campus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketComment {
    private String id;
    private String authorId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
