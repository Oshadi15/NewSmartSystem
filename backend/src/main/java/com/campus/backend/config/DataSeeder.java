package com.campus.backend.config;

import com.campus.backend.model.*;
import com.campus.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DataSeeder — inserts demo data on startup if collections are empty.
 *
 * <p>This ensures the UI is never blank during a demo.
 * Safe to run repeatedly — checks for existing data before inserting.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final ResourceRepository  resourceRepository;
    private final BookingRepository   bookingRepository;
    private final TicketRepository    ticketRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository      userRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedResources();
        seedDemoDataIfUsersExist();
    }

    // ── Resources ────────────────────────────────────────────────────────────

    private void seedResources() {
        if (resourceRepository.count() > 0) {
            log.info("Resources already seeded — skipping.");
            return;
        }

        ResourceAvailability allDay = new ResourceAvailability(LocalTime.of(8, 0), LocalTime.of(22, 0));

        List<Resource> resources = List.of(
            Resource.builder()
                .name("Lecture Hall A")
                .type(ResourceType.LECTURE_HALL)
                .capacity(120)
                .location("Building 1, Ground Floor")
                .availability(allDay)
                .status(ResourceStatus.ACTIVE)
                .build(),

            Resource.builder()
                .name("Computer Lab 1")
                .type(ResourceType.LAB)
                .capacity(40)
                .location("Building 2, Floor 1")
                .availability(allDay)
                .status(ResourceStatus.ACTIVE)
                .build(),

            Resource.builder()
                .name("Conference Room B")
                .type(ResourceType.MEETING_ROOM)
                .capacity(20)
                .location("Admin Block, Floor 2")
                .availability(allDay)
                .status(ResourceStatus.ACTIVE)
                .build(),

            Resource.builder()
                .name("Projector Unit #3")
                .type(ResourceType.EQUIPMENT)
                .capacity(null)
                .location("AV Store Room")
                .availability(allDay)
                .status(ResourceStatus.ACTIVE)
                .build(),

            Resource.builder()
                .name("Biology Lab")
                .type(ResourceType.LAB)
                .capacity(30)
                .location("Science Block, Floor 1")
                .availability(allDay)
                .status(ResourceStatus.OUT_OF_SERVICE)
                .build()
        );

        resourceRepository.saveAll(resources);
        log.info("Seeded {} demo resources.", resources.size());
    }

    // ── Bookings + Tickets + Notifications (only if a user exists in DB) ────

    private void seedDemoDataIfUsersExist() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            log.info("No users found — skipping booking/ticket/notification seed. Login first to trigger user creation.");
            return;
        }

        User firstUser = users.get(0);
        String userId = firstUser.getId();
        String userName = firstUser.getName() != null ? firstUser.getName() : "Demo User";

        List<Resource> resources = resourceRepository.findAll();
        if (resources.isEmpty()) return;

        String resourceId1 = resources.get(0).getId();
        String resourceId2 = resources.size() > 1 ? resources.get(1).getId() : resourceId1;

        seedBookings(userId, resourceId1, resourceId2);
        seedTickets(userId, resourceId1);
        seedNotifications(userId, userName);
    }

    private void seedBookings(String userId, String resourceId1, String resourceId2) {
        if (bookingRepository.count() > 0) {
            log.info("Bookings already seeded — skipping.");
            return;
        }

        LocalDateTime base = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0);

        List<Booking> bookings = List.of(
            Booking.builder()
                .userId(userId)
                .resourceId(resourceId1)
                .startTime(base)
                .endTime(base.plusHours(2))
                .purpose("CS101 Monday Lecture")
                .attendees(80)
                .status(BookingStatus.APPROVED)
                .build(),

            Booking.builder()
                .userId(userId)
                .resourceId(resourceId2)
                .startTime(base.plusDays(1))
                .endTime(base.plusDays(1).plusHours(3))
                .purpose("Database Lab Session")
                .attendees(35)
                .status(BookingStatus.PENDING)
                .build(),

            Booking.builder()
                .userId(userId)
                .resourceId(resourceId1)
                .startTime(base.plusDays(3))
                .endTime(base.plusDays(3).plusHours(1))
                .purpose("Faculty Meeting")
                .attendees(15)
                .status(BookingStatus.REJECTED)
                .rejectionReason("Hall unavailable — maintenance scheduled.")
                .build(),

            Booking.builder()
                .userId(userId)
                .resourceId(resourceId2)
                .startTime(base.plusDays(5))
                .endTime(base.plusDays(5).plusHours(2))
                .purpose("Python Workshop")
                .attendees(38)
                .status(BookingStatus.CANCELLED)
                .build()
        );

        bookingRepository.saveAll(bookings);
        log.info("Seeded {} demo bookings.", bookings.size());
    }

    private void seedTickets(String userId, String resourceId) {
        if (ticketRepository.count() > 0) {
            log.info("Tickets already seeded — skipping.");
            return;
        }

        List<Ticket> tickets = List.of(
            Ticket.builder()
                .reporterId(userId)
                .resourceId(resourceId)
                .category("MAINTENANCE")
                .description("Projector in Lecture Hall A is not turning on. Tried multiple times but no response. Needed urgently for tomorrow's lecture.")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.IN_PROGRESS)
                .assignedTo("tech-team-01")
                .build(),

            Ticket.builder()
                .reporterId(userId)
                .category("IT_SUPPORT")
                .description("WiFi is extremely slow in the Computer Lab 1. Students are unable to complete online assessments.")
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.OPEN)
                .build(),

            Ticket.builder()
                .reporterId(userId)
                .category("CLEANING")
                .description("Restrooms near Block C need urgent cleaning. The floor is wet and there's no sign placed.")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.RESOLVED)
                .resolutionNotes("Cleaning crew dispatched on 09/04. Issue resolved.")
                .build(),

            Ticket.builder()
                .reporterId(userId)
                .category("SECURITY")
                .description("Main gate camera has been offline since Monday. Please check and fix the CCTV system.")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.CLOSED)
                .resolutionNotes("Camera replaced and tested. All feeds now operational.")
                .build()
        );

        ticketRepository.saveAll(tickets);
        log.info("Seeded {} demo tickets.", tickets.size());
    }

    private void seedNotifications(String userId, String userName) {
        if (notificationRepository.count() > 0) {
            log.info("Notifications already seeded — skipping.");
            return;
        }

        List<Notification> notifications = List.of(
            Notification.builder()
                .userId(userId)
                .message("✅ Your booking for 'CS101 Monday Lecture' has been APPROVED.")
                .type(NotificationType.BOOKING_APPROVED)
                .readStatus(false)
                .build(),

            Notification.builder()
                .userId(userId)
                .message("❌ Your booking for 'Faculty Meeting' was REJECTED. Reason: Hall unavailable — maintenance scheduled.")
                .type(NotificationType.BOOKING_REJECTED)
                .readStatus(false)
                .build(),

            Notification.builder()
                .userId(userId)
                .message("🔧 Your ticket 'Projector not working' has been assigned to a technician and is now IN PROGRESS.")
                .type(NotificationType.TICKET_STATUS_CHANGED)
                .readStatus(true)
                .build(),

            Notification.builder()
                .userId(userId)
                .message("✅ Your ticket 'Restroom cleaning' has been RESOLVED. Notes: Cleaning crew dispatched on 09/04.")
                .type(NotificationType.TICKET_STATUS_CHANGED)
                .readStatus(true)
                .build(),

            Notification.builder()
                .userId(userId)
                .message("💬 A new comment was added to your IT Support ticket.")
                .type(NotificationType.NEW_COMMENT)
                .readStatus(false)
                .build()
        );

        notificationRepository.saveAll(notifications);
        log.info("Seeded {} demo notifications for user {}.", notifications.size(), userName);
    }
}
