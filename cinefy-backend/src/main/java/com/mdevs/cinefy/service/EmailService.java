package com.mdevs.cinefy.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

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
        Map<String, Object> variables = Map.of(
                "name", name,
                "code", code,
                "expiryMinutes", expiryMinutes);
        send(to, "Reset your password", "reset-password-otp", variables);
    }

    // =========================== Helpers ===========================

    private void send(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String html = templateEngine.process(templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send '{}' email to {}", templateName, to, ex);
        }
    }
}
