package com.campus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents an authenticated campus user.
 * Created on first Google sign-in; role defaults to USER.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    /** Unique email from Google — used as the natural key for lookup. */
    @Indexed(unique = true)
    private String email;

    /** Picture URL from Google profile (optional). */
    private String picture;

    @Builder.Default
    private Role role = Role.USER;

    @CreatedDate
    private LocalDateTime createdAt;
}

