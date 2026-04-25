package com.campus.backend.service;

import com.campus.backend.dto.AuthResponse;
import com.campus.backend.dto.GoogleAuthRequest;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.Role;
import com.campus.backend.model.User;
import com.campus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Handles Google OAuth sign-in logic.
 *
 * <p>On every login attempt:
 * <ol>
 *   <li>Look up the user by email.</li>
 *   <li>If not found, create a new account with role = USER.</li>
 *   <li>Return userId + role so the frontend can attach them as request headers.</li>
 * </ol>
 *
 * <p>No JWT is issued — the system relies on X-User-Id / X-User-Role
 * headers validated by {@code AuthInterceptor} on every request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Authenticates (or auto-registers) a user via Google OAuth profile data.
     *
     * @param request contains email, name, picture from the Google token
     * @return session-like response with userId and role
     */
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ValidationException("Email is required for authentication");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    log.info("New user registered via Google: {}", request.getEmail());
                    User newUser = User.builder()
                            .email(request.getEmail())
                            .name(request.getName())
                            .picture(request.getPicture())
                            .role(Role.USER)
                            .build();
                    return userRepository.save(newUser);
                });

        // Update name/picture on every login in case they changed in Google account
        boolean updated = false;
        if (request.getName() != null && !request.getName().equals(user.getName())) {
            user.setName(request.getName());
            updated = true;
        }
        if (request.getPicture() != null && !request.getPicture().equals(user.getPicture())) {
            user.setPicture(request.getPicture());
            updated = true;
        }
        if (updated) {
            user = userRepository.save(user);
        }

        log.info("User authenticated: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPicture(),
                user.getRole().name()
        );
    }

    /**
     * Returns the current user profile by userId.
     * Used by the frontend to restore session after page refresh.
     */
    public AuthResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.campus.backend.exception.ResourceNotFoundException(
                        "User not found: " + userId));
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getPicture(), user.getRole().name());
    }
}
