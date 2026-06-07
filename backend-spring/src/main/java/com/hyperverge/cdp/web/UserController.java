package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.User;
import com.hyperverge.cdp.repository.UserRepository;
import com.hyperverge.cdp.service.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final DtoMapper mapper;

    @Value("${app.upload-dir}")
    private String uploadDir;

    @GetMapping("/me")
    public Dtos.UserResponse me(@AuthenticationPrincipal User user) {
        return mapper.user(user);
    }

    @PutMapping("/me")
    public Dtos.UserResponse updateMe(@AuthenticationPrincipal User user, @Valid @RequestBody Dtos.UserUpdate request) {
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        return mapper.user(userRepository.save(user));
    }

    @PostMapping("/me/avatar")
    public Dtos.UserResponse uploadAvatar(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        try {
            String extension = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                extension = original.substring(original.lastIndexOf("."));
            }
            Path directory = Path.of(uploadDir);
            Files.createDirectories(directory);
            String filename = "user_%d_%d%s".formatted(user.getId(), Instant.now().getEpochSecond(), extension);
            Path target = directory.resolve(filename);
            file.transferTo(target);
            user.setAvatarUrl("/static/avatars/" + filename);
            return mapper.user(userRepository.save(user));
        } catch (Exception exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Could not upload file");
        }
    }
}
