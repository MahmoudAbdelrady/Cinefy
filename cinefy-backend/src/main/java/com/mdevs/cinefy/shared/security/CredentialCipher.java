package com.mdevs.cinefy.shared.security;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class CredentialCipher {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    private static final int GCM_IV_LENGTH = 12;

    private static final int GCM_TAG_LENGTH_BITS = 128;

    private static final String SEPARATOR = ":";

    private static final int REQUIRED_KEY_LENGTH = 32;

    private final SecretKey masterKey;

    private final SecureRandom random = new SecureRandom();

    public CredentialCipher(@Value("${cinefy.encryption.key}") String base64Key) {
        if (StringUtils.isEmpty(base64Key)) {
            throw new IllegalStateException("encryption key must be set");
        }
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != REQUIRED_KEY_LENGTH) {
            throw new IllegalStateException("encryption key must decode to " + REQUIRED_KEY_LENGTH + " bytes (AES-256). Got " + keyBytes.length);
        }
        this.masterKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            Base64.Encoder encoder = Base64.getEncoder();
            return encoder.encodeToString(iv) + SEPARATOR + encoder.encodeToString(ciphertext);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to encrypt credentials");
        }
    }

    public String decrypt(String payload) {
        String[] parts = payload.split(SEPARATOR, 2);
        if (parts.length != 2) {
            throw new IllegalStateException("Invalid encrypted payload format");
        }

        try {
            Base64.Decoder decoder = Base64.getDecoder();
            byte[] iv = decoder.decode(parts[0]);
            byte[] ciphertext = decoder.decode(parts[1]);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);

            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Failed to decrypt credentials");
        }
    }
}
