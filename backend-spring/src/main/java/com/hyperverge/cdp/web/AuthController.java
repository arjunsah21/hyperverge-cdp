package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.User;
import com.hyperverge.cdp.repository.UserRepository;
import com.hyperverge.cdp.security.JwtService;
import com.hyperverge.cdp.service.DtoMapper;
import com.hyperverge.cdp.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final DtoMapper mapper;
    private final SecureRandom random = new SecureRandom();

    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Dtos.TokenResponse token(@RequestParam("username") String email, @RequestParam String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Incorrect email or password"));
        if (!Boolean.TRUE.equals(user.getIsActive()) || !passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Incorrect email or password");
        }
        return new Dtos.TokenResponse(jwtService.generateToken(user), "bearer");
    }

    @PostMapping("/register")
    public Dtos.UserResponse register(@Valid @RequestBody Dtos.UserCreate request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already registered");
        }
        String code = verificationCode();
        emailService.sendVerificationEmail(request.email(), code);

        User user = new User();
        user.setEmail(request.email());
        user.setHashedPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole("VIEWER");
        user.setIsActive(false);
        user.setVerificationCode(code);
        return mapper.user(userRepository.save(user));
    }

    @PostMapping("/verify")
    public Object verify(@Valid @RequestBody Dtos.VerifyEmail request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        if (!request.code().equals(user.getVerificationCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid verification code");
        }
        user.setIsActive(true);
        user.setVerificationCode(null);
        userRepository.save(user);
        return java.util.Map.of("message", "Email verified successfully");
    }

    @PostMapping("/forgot-password")
    public Object forgotPassword(@Valid @RequestBody Dtos.ForgotPassword request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        String code = verificationCode();
        user.setVerificationCode(code);
        userRepository.save(user);
        emailService.sendVerificationEmail(request.email(), code);
        return java.util.Map.of("message", "Password reset code sent");
    }

    @PostMapping("/reset-password")
    public Object resetPassword(@Valid @RequestBody Dtos.ResetPassword request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        if (!request.code().equals(user.getVerificationCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid verification code");
        }
        user.setHashedPassword(passwordEncoder.encode(request.newPassword()));
        user.setVerificationCode(null);
        userRepository.save(user);
        return java.util.Map.of("message", "Password reset successfully");
    }

    private String verificationCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
