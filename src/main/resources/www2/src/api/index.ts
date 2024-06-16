import admin from "./admin";
import auth from "./auth";
import config from "./config";
import device from "./device";
import diagnostic from "./diagnostic";
import group from "./group";
import hardwareRule from "./hardwareRule";
import policy from "./policy";
import report from "./report";
import rule from "./rule";
import script from "./script";
import softwareRule from "./softwareRule";
import task from "./task";
import user from "./user";

export * from "./types";

export default {
  device,
  group,
  config,
  auth,
  user,
  task,
  admin,
  diagnostic,
  script,
  hardwareRule,
  softwareRule,
  policy,
  rule,
  report,
};
