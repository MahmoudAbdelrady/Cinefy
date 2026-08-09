package com.mdevs.cinefy.service;

import com.mdevs.cinefy.dto.email.InlineResource;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private final SpringTemplateEngine templateEngine;

    // ========================= Public API =========================

    @Async
    public void sendPasswordResetOtp(String to, String name, String code, int expiryMinutes) {
        sendOtpVerification(
                to,
                "Reset your password",
                "Reset your password",
                "We received a request to reset your password. Use the verification code below to continue. "
                        + "Do not share this code with anyone.",
                "If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.",
                name,
                code,
                expiryMinutes);
    }

    @Async
    public void sendEmailVerificationOtp(String to, String name, String code, int expiryMinutes) {
        sendOtpVerification(
                to,
                "Verify your email",
                "Verify your email",
                "Welcome to Cinefy! Use the verification code below to confirm your email address and activate your "
                        + "account. Do not share this code with anyone.",
                "If you didn't create a Cinefy account, you can safely ignore this email.",
                name,
                code,
                expiryMinutes);
    }

    @Async
    public void sendBookingTicket(String to, Map<String, Object> variables, List<InlineResource> inlineResources) {
        send(to, "Your Cinefy ticket", "booking-ticket-template", variables, inlineResources);
    }

    // =========================== Helpers ===========================

    private void sendOtpVerification(String to, String title, String heading, String intro, String disclaimer,
                                     String name, String code, int expiryMinutes) {
        Map<String, Object> variables = Map.of(
                "title", title,
                "heading", heading,
                "intro", intro,
                "disclaimer", disclaimer,
                "name", name,
                "code", code,
                "expiryMinutes", expiryMinutes);
        send(to, title, "otp-verification-template", variables);
    }

    private void send(String to, String subject, String templateName, Map<String, Object> variables) {
        send(to, subject, templateName, variables, List.of());
    }

    private void send(String to, String subject, String templateName, Map<String, Object> variables,
                      List<InlineResource> inlineResources) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String html = templateEngine.process(templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            for (InlineResource resource : inlineResources) {
                helper.addInline(
                        resource.contentId(),
                        new ByteArrayResource(resource.content()),
                        resource.contentType());
            }

            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send '{}' email to {}", templateName, to, ex);
        }
    }
}
