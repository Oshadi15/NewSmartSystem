package com.campus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response returned after a successful Google authentication.
 * Frontend stores these values in localStorage and attaches them
 * as X-User-Id and X-User-Role headers on every API request.
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String userId;
    private String name;
    private String email;
    private String picture;
    private String role;
}
