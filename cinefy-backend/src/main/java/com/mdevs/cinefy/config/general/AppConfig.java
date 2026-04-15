package com.mdevs.cinefy.config.general;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Properties;

@Configuration
public class AppConfig {
    @Getter
    private static ApplicationContext applicationContext;

    @Value("${cinefy.mail.username}")
    private String emailUsername;

    @Value("${cinefy.mail.password}")
    private String emailPassword;

    public AppConfig(ApplicationContext applicationContext) {
        AppConfig.applicationContext = applicationContext;
    }

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);

        mailSender.setUsername(emailUsername);
        mailSender.setPassword(emailPassword);

        Properties properties = mailSender.getJavaMailProperties();
        properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.debug", "true");

        return mailSender;
    }

    public static String getFrontendUrl() {
        return applicationContext.getEnvironment().getProperty("app.frontend.url");
    }

    public static boolean isProductionEnv() {
        return Arrays.stream(applicationContext.getEnvironment().getActiveProfiles()).anyMatch(profile -> profile.equalsIgnoreCase("prod"));
    }
}
