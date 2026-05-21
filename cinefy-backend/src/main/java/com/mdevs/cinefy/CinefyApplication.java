package com.mdevs.cinefy;

import com.mdevs.cinefy.service.StaffMemberService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@EnableJpaAuditing
@EnableScheduling
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
@SpringBootApplication
public class CinefyApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinefyApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedAdminAccount(StaffMemberService staffMemberService,
                                              @Value("${cinefy.admin.username}") String adminUsername,
                                              @Value("${cinefy.admin.password:}") String adminPassword) {
        return _ -> {
            if (StringUtils.isBlank(adminPassword)) {
                log.warn("Skipping admin account seed: cinefy.admin.password is not set");
                return;
            }
            staffMemberService.ensureAdminExists(adminUsername, adminPassword);
        };
    }
}
