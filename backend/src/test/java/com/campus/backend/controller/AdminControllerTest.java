package com.campus.backend.controller;

import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.Role;
import com.campus.backend.model.User;
import com.campus.backend.repository.BookingRepository;
import com.campus.backend.repository.ResourceRepository;
import com.campus.backend.repository.TicketRepository;
import com.campus.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private UserRepository userRepository;

    private AdminController adminController;

    @BeforeEach
    void setUp() {
        adminController = new AdminController(
                bookingRepository,
                ticketRepository,
                resourceRepository,
                userRepository
        );
    }

    @Test
    void updateUserRole_rejectsInvalidRole() {
        User user = User.builder().id("u1").role(Role.USER).build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        assertThrows(ValidationException.class,
                () -> adminController.updateUserRole("ADMIN", "u1", "SUPERADMIN"));
    }

    @Test
    void updateUserRole_rejectsNonAdminCaller() {
        assertThrows(UnauthorizedException.class,
                () -> adminController.updateUserRole("USER", "u1", "ADMIN"));
    }

    @Test
    void updateUserRole_acceptsTechnicianRole() {
        User user = User.builder().id("u1").role(Role.USER).build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User response = adminController.updateUserRole("ADMIN", "u1", "TECHNICIAN").getBody();
        assertEquals(Role.TECHNICIAN, response.getRole());
    }
}
