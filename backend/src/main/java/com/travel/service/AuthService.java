package com.travel.service;

import com.travel.dao.UserDao;
import com.travel.dto.UserDTO;
import com.travel.model.AppUser;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 登录注册业务逻辑：校验 → BCrypt 哈希 → MySQL 持久化 → 签发 token。
 */
@Service
public class AuthService {

    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[\\u4e00-\\u9fa5A-Za-z0-9_]{2,20}$");

    private final UserDao userDao;
    private final BCryptPasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserDao userDao, BCryptPasswordEncoder encoder) {
        this.userDao = userDao;
        this.encoder = encoder;
    }

    /** 注册：校验 → 查重 → 哈希入库 → 建会话。失败时抛出携带中文提示的异常。 */
    public UserDTO register(String username, String password) {
        String name = normalize(username);
        if (name.isEmpty()) {
            throw new AuthException("请输入用户名");
        }
        if (!USERNAME_PATTERN.matcher(name).matches()) {
            throw new AuthException("用户名需为 2–20 位中文、字母、数字或下划线");
        }
        String pwd = String.valueOf(password == null ? "" : password);
        if (pwd.length() < 6 || pwd.length() > 32) {
            throw new AuthException("密码长度需为 6–32 位");
        }
        String key = usernameKey(name);
        if (userDao.findByUsernameKey(key) != null) {
            throw new AuthException("这个用户名已经被注册了，换一个试试吧");
        }

        String hash = encoder.encode(pwd);
        userDao.insertUser(name, key, hash);

        AppUser user = userDao.findByUsernameKey(key);
        if (user == null) {
            throw new AuthException("注册失败，请稍后再试");
        }
        String token = issueToken(key);
        return toDTO(user, token);
    }

    /** 登录：查用户 → BCrypt 校验 → 封禁拦截 → 建会话。 */
    public UserDTO login(String username, String password) {
        String name = normalize(username);
        if (name.isEmpty()) {
            throw new AuthException("请输入用户名");
        }
        String pwd = String.valueOf(password == null ? "" : password);
        if (pwd.isEmpty()) {
            throw new AuthException("请输入密码");
        }
        AppUser user = userDao.findByUsernameKey(usernameKey(name));
        if (user == null || !encoder.matches(pwd, user.getPasswordHash())) {
            throw new AuthException("用户名或密码不正确");
        }
        if (user.isBanned()) {
            throw new AuthException(banMessage(user));
        }
        String token = issueToken(user.getUsernameKey());
        return toDTO(user, token);
    }

    /** 校验 token，返回对应用户信息（不含密码）。token 无效返回 null；被封禁抛异常。 */
    public UserDTO me(String token) {
        AppUser user = resolveUserByToken(token);
        if (user == null) {
            return null;
        }
        if (user.isBanned()) {
            throw new AuthException(banMessage(user));
        }
        return toDTO(user, null);
    }

    /** 根据 token 解析出用户实体，无效返回 null。供 /me 与后台鉴权复用。 */
    public AppUser resolveUserByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        String key = userDao.findSessionUsernameKey(token.trim());
        if (key == null) {
            return null;
        }
        return userDao.findByUsernameKey(key);
    }

    /** 要求调用者为管理员：未登录或非管理员均抛出携带中文提示的异常。 */
    public AppUser requireAdmin(String token) {
        AppUser user = resolveUserByToken(token);
        if (user == null) {
            throw new AuthException("未登录或登录已过期");
        }
        if (!user.isAdmin()) {
            throw new AuthException("无管理员权限");
        }
        return user;
    }

    private String issueToken(String usernameKey) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        String token = sb.toString();
        userDao.insertSession(token, usernameKey);
        return token;
    }

    private UserDTO toDTO(AppUser user, String token) {
        return new UserDTO(user.getUsername(), user.getCreatedAt(), token, user.getRole());
    }

    static String banMessage(AppUser user) {
        String reason = user.getBanReason();
        if (reason == null || reason.trim().isEmpty()) {
            return "账号已被封禁，请联系管理员";
        }
        return "账号已被封禁，原因：" + reason.trim();
    }

    private static String normalize(String username) {
        return username == null ? "" : username.trim();
    }

    static String usernameKey(String username) {
        return normalize(username).toLowerCase(Locale.ROOT);
    }

    /** 业务校验异常，携带面向用户的中文提示。 */
    public static class AuthException extends RuntimeException {
        public AuthException(String message) {
            super(message);
        }
    }
}
