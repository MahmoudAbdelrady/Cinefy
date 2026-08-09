package com.mdevs.cinefy.shared;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
public class QrGenerator {

    private static final QRCodeWriter WRITER = new QRCodeWriter();

    private static final String IMAGE_FORMAT = "PNG";

    private static final int SIZE = 512;

    private static final int MARGIN = 1;

    private static final String DATA_URI_PREFIX = "data:image/" + IMAGE_FORMAT.toLowerCase() + ";base64,";

    public static String toDataUri(byte[] qrCode) {
        return DATA_URI_PREFIX + Base64.getEncoder().encodeToString(qrCode);
    }

    public byte[] generate(String content) {
        Map<EncodeHintType, Object> hints = Map.of(
                EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name(),
                EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                EncodeHintType.MARGIN, MARGIN
        );

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            BitMatrix matrix = WRITER.encode(content, BarcodeFormat.QR_CODE, SIZE, SIZE, hints);
            MatrixToImageWriter.writeToStream(matrix, IMAGE_FORMAT, output);
            return output.toByteArray();
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Failed to generate QR code");
        }
    }
}
