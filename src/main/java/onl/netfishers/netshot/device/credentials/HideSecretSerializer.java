package onl.netfishers.netshot.device.credentials;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

/**
 * Custom JSON serializer to hide secret with simple "=" character.
 */
public class HideSecretSerializer extends JsonSerializer<String> {

	private static String MASK_TEXT = "=";

	public static boolean isMasked(String text) {
		return HideSecretSerializer.MASK_TEXT.equals(text);
	}

	@Override
	public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
		gen.writeString(HideSecretSerializer.MASK_TEXT);
	}
}
