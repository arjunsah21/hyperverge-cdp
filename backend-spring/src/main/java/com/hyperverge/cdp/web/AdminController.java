package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.User;
import com.hyperverge.cdp.repository.UserRepository;
import com.hyperverge.cdp.service.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private static final Set<String> ROLES = Set.of("SUPER_ADMIN", "ADMIN", "VIEWER");

    private final UserRepository userRepository;
    private final DtoMapper mapper;

    @GetMapping("/users")
    public List<Dtos.UserResponse> users(@RequestParam(name = "skip", defaultValue = "0") int skip, @RequestParam(name = "limit", defaultValue = "100") int limit) {
        return userRepository.findAll().stream()
                .skip(skip)
                .limit(limit)
                .map(mapper::user)
                .toList();
    }

    @PutMapping("/users/{userId}/role")
    public Dtos.UserResponse updateRole(@PathVariable Long userId, @Valid @RequestBody Dtos.UserUpdate request) {
        if (request.role() == null || !ROLES.contains(request.role())) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid role");
        }
        User user = findUser(userId);
        user.setRole(request.role());
        return mapper.user(userRepository.save(user));
    }

    @PutMapping("/users/{userId}")
    public Dtos.UserResponse updateUser(@PathVariable Long userId, @Valid @RequestBody Dtos.UserAdminUpdate request) {
        User user = findUser(userId);
        if (request.role() != null) {
            if (!ROLES.contains(request.role())) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid role");
            }
            user.setRole(request.role());
        }
        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(BAD_REQUEST, "Email already registered");
            }
            user.setEmail(request.email());
        }
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }
        return mapper.user(userRepository.save(user));
    }

    @DeleteMapping("/users/{userId}")
    public java.util.Map<String, String> deleteUser(@PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
        User user = findUser(userId);
        if (user.getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot delete yourself");
        }
        userRepository.delete(user);
        return java.util.Map.of("message", "User deleted successfully");
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }
}
