package cn.edu.qvtu.common.util;

import org.springframework.util.DigestUtils;

/**
 * 密码加密工具类
 */
public class PasswordUtil {

    private static final int MD5_LENGTH = 32;

    /**
     * MD5加密
     */
    public static String md5Encrypt(String password) {
        if (password == null) {
            return null;
        }
        return DigestUtils.md5DigestAsHex(password.getBytes()).toLowerCase();
    }

    /**
     * 自动处理密码验证 - 智能判断密码格式
     */
    public static boolean verifyPassword(String inputPassword, String storedPassword) {
        if (inputPassword == null || storedPassword == null) {
            System.out.println("密码验证失败：输入密码或存储密码为空");
            return false;
        }

        System.out.println("=== 密码验证详情 ===");
        System.out.println("输入密码: " + inputPassword);
        System.out.println("存储密码: " + storedPassword);
        System.out.println("存储密码长度: " + storedPassword.length());
        System.out.println("是否32位: " + (storedPassword.length() == MD5_LENGTH));
        System.out.println("是否MD5格式: " + storedPassword.matches("[a-fA-F0-9]{32}"));

        // 如果存储的密码已经是32位MD5格式，则输入密码需要加密后比较
        if (storedPassword.length() == MD5_LENGTH && storedPassword.matches("[a-fA-F0-9]{32}")) {
            String encryptedInput = md5Encrypt(inputPassword);
            System.out.println("MD5加密后输入密码: " + encryptedInput);
            System.out.println("是否匹配: " + encryptedInput.equalsIgnoreCase(storedPassword));
            return encryptedInput.equalsIgnoreCase(storedPassword);
        } else {
            // 否则可能是明文，或者第一次使用（需要加密存储）
            System.out.println("存储密码不是MD5格式，尝试明文比较");
            System.out.println("明文是否匹配: " + inputPassword.equals(storedPassword));

            // 直接比较明文（兼容旧系统）
            if (inputPassword.equals(storedPassword)) {
                return true;
            }

            // 如果不匹配，也尝试MD5加密后比较（双重验证）
            String encryptedInput = md5Encrypt(inputPassword);
            System.out.println("MD5加密后输入密码: " + encryptedInput);
            System.out.println("MD5加密后是否匹配: " + encryptedInput.equalsIgnoreCase(storedPassword));
            return encryptedInput.equalsIgnoreCase(storedPassword);
        }
    }

    /**
     * 确保密码以正确格式存储
     * @return 加密后的密码
     */
    public static String ensurePasswordEncrypted(String password) {
        if (password == null) {
            return null;
        }

        System.out.println("=== 密码加密详情 ===");
        System.out.println("原始密码: " + password);
        System.out.println("密码长度: " + password.length());

        // 如果密码已经是32位MD5格式，直接返回
        if (password.length() == MD5_LENGTH && password.matches("[a-fA-F0-9]{32}")) {
            System.out.println("密码已经是MD5格式，直接返回");
            return password.toLowerCase();
        }

        // 否则进行MD5加密
        String encrypted = md5Encrypt(password);
        System.out.println("MD5加密后: " + encrypted);
        return encrypted;
    }
}