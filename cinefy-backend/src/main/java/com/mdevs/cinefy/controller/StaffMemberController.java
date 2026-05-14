package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.service.StaffMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
public class StaffMemberController {

    private final StaffMemberService staffMemberService;
}
