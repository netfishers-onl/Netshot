// Values match the Java enum constant names (DeviceSnmpv3Community.AuthProtocol /
// PrivProtocol), which are serialized/deserialized by name over the REST API.
export enum HashingAlgorithm {
  NONE = "NONE",
  MD5 = "MD5",
  SHA = "SHA",
  HMAC128SHA224 = "HMAC128SHA224",
  HMAC192SHA256 = "HMAC192SHA256",
  HMAC256SHA384 = "HMAC256SHA384",
  HMAC384SHA512 = "HMAC384SHA512",
  DES = "DES",
  DES3 = "DES3",
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
}
