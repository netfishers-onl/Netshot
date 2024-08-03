package onl.netfishers.netshot.device.credentials;

import java.io.IOException;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

public class HideSecretDeserializer extends JsonDeserializer<String> {

	@Override
	public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JacksonException {
		String s = p.getValueAsString();
		if (HideSecretSerializer.isMasked(s)) {
			return null;
		}
		return s;
	}
	
}
