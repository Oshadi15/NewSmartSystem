package com.campus.backend.service;

import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.model.Notification;
import com.campus.backend.model.NotificationType;
import com.campus.backend.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void markAsRead_rejectsNonOwnerWhenNotAdmin() {
        Notification notification = Notification.builder()
                .id("n1")
                .userId("owner-1")
                .type(NotificationType.NEW_COMMENT)
                .message("msg")
                .readStatus(false)
                .build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        assertThrows(UnauthorizedException.class,
                () -> notificationService.markAsRead("n1", "other-user", "USER"));
        verify(notificationRepository, never()).save(notification);
    }

    @Test
    void deleteNotification_allowsAdmin() {
        Notification notification = Notification.builder()
                .id("n2")
                .userId("owner-1")
                .type(NotificationType.NEW_COMMENT)
                .message("msg")
                .readStatus(false)
                .build();
        when(notificationRepository.findById("n2")).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("n2", "admin-user", "ADMIN");
        verify(notificationRepository).delete(notification);
    }
}
