/**
 * Cisco Catalyst Next-Gen Series (Cisco Business-like CLI) Driver for Netshot
 * Target: Catalyst 1200/1300 Series (e.g., C1200-16T-2G)
 *
 * Author: David Micallef (Pizu)
 * Version: 1.2 (ES6+)
 *
 * Notes:
 * - Login flow via mini-modes + enable macro (no ssh.targets).
 * - No VRF: these platforms don’t support it; helper won’t add vrf.
 * - Robust “System *” capture handles wrapped lines.
 * - Firmware regex accepts 2.1.1.1, 2.1.1.1.SPA, v2.1.1.1, etc.
 * - Family derived from System Description or Inventory DESCR, with fallback.
 */

/* ========================= DRIVER META ========================= */

const Info = {
  name: "CiscoNextGenSeries",
  description: "Cisco Catalyst Next-Gen Series",
  author: "DMica(Pizu)",
  version: "1.2"
};

/* ========================= CONFIG MAP ========================= */

const Config = {
  runningConfig: {
    type: "LongText",
    title: "Running configuration",
    comparable: true,
    searchable: true,
    checkable: true,
    dump: {
      pre: "!! Running configuration (taken on %when%):",
      post: "!! End of running configuration"
    }
  },
  firmwareVersion: {
    type: "Text",
    title: "Firmware version",
    comparable: true,
    searchable: true,
    checkable: true
  }
};

// Keep Device empty to avoid redefining built-in attributes (name, family, etc.)
const Device = {};

/* ========================= CLI LAYER ========================= */

const PROMPT_EXEC   = /^.*>\s?$/m;
const PROMPT_ENABLE = /^.*(?:\(config[^)]*\))?#\s?$/m;

const PAGER_RE = new RegExp(
  "(?:^|\\r?\\n)" +
  "(?:" +
    "\\-\\-More\\-\\-" +
    "|More:\\s*<space>.*" +
    "|\\[?more\\]?\\s*$" +
  ")",
  "mi"
);

const CLI = {
  // Transport definition: macro walks options until target mode is reached.
  ssh: {
    macros: {
      enable: {
        // Order matters: clear banners first, then exec → enable.
        options: ["username", "password", "anykey", "exec", "enable"],
        target: "enable"
      }
    }
  },

  /* ---------- Small, single-purpose modes for login banners ---------- */

  username: {
    // Matches "User Name:", "Username:", "login:"
    prompt: /(User\s*Name|Username|login):\s*$/mi,
    response: "%username%"
  },

  password: {
    prompt: /Password:\s*$/mi,
    response: "%password%"
  },

  anykey: {
    // Some images show "Press any key..." prior to the login prompts.
    prompt: /Press any key to continue\.{0,3}\s*$/mi,
    response: "\n",
    optional: true
  },

  /* -------------------------- Normal modes --------------------------- */

  exec: {
    prompt: PROMPT_EXEC,
    pager: {
      match: PAGER_RE,
      response: " "
    }
  },

  enable: {
    prompt: PROMPT_ENABLE,
    // Run once we’re at an enable-capable prompt.
    commands: [
      // Some images don’t require enable; keep optional.
      { command: "enable", expect: /Password:\s*$/mi, response: "%enablePassword%", optional: true },
      { command: "terminal datadump", optional: true },
      { command: "terminal length 0", optional: true },
      { command: "terminal width 511", optional: true }
    ],
    pager: {
      match: PAGER_RE,
      response: " "
    }
  }
};

/* ========================= HELPERS ========================= */

/**
 * Normalize an interface object for Netshot without adding unsupported fields (e.g., VRF).
 */
const ensureIfaceShape = (obj, fallbackName, isL3) => {
  obj = (obj && typeof obj === "object") ? obj : {};
  obj.name = (obj.name != null ? String(obj.name) : String(fallbackName || "")).trim();
  if (!obj.name) return null;

  if (obj.description == null) obj.description = "";
  if (obj.level3 == null) obj.level3 = !!isL3;

  if (obj.enabled == null) obj.enabled = false;
  if (obj.adminStatus == null) obj.adminStatus = obj.enabled ? "Up" : "Down";
  if (obj.linkStatus == null) obj.linkStatus = obj.adminStatus;

  if (!Array.isArray(obj.ip)) obj.ip = [];
  obj.ip = obj.ip.filter(x => x && typeof x === "object" && (x.ip || x.address));

  // Drop empty MAC keys; keep whatever delimiter style the device prints (dashes/colons/dots)
  if (!obj.mac) delete obj.mac;
  if (!obj.macAddress) delete obj.macAddress;

  return obj;
};

const scrubMacs = o => {
  if (!o) return o;
  if (!o.mac) delete o.mac;
  if (!o.macAddress) delete o.macAddress;
  return o;
};

// Dedup guards
const addedIfaces = {};
const addIfaceOnce = (device, kindObj) => {
  if (!kindObj || !kindObj.name) return;
  const key = String(kindObj.name).toLowerCase();
  if (addedIfaces[key]) return;
  addedIfaces[key] = true;
  device.add("networkInterface", kindObj);
};

const addedModules = {};
const addModuleOnce = (device, mod) => {
  if (!mod) return;
  // Build a stable dedup key: slot|partNumber|serialNumber (lower-cased)
  const k = [
    mod.slot || "",
    mod.partNumber || "",
    mod.serialNumber || ""
  ].join("|").toLowerCase();
  if (addedModules[k]) return;
  addedModules[k] = true;
  device.add("module", mod);
};

/* ========================= SNAPSHOT ========================= */

function snapshot(cli, device, config) {
  // Land in enable mode first.
  try { cli.macro("enable"); } catch (e) {}

  /* -------- System (wrapped-field aware) -------- */
  let sys = ""; try { sys = cli.command("show system"); } catch (e) {}

  // Capture a label whose value might wrap onto indented continuation lines.
  const captureWrapped = (label, text) => {
    const re = new RegExp(`^\\s*${label}:\\s+(.+)$`, "mi");
    const m = text.match(re);
    if (!m) return "";
    const lines = [m[1].trim()];

    const startIdx = text.indexOf(m[0]);
    const rest = text.slice(startIdx + m[0].length);
    const contRe = /^\s{2,}(\S.*)$/m; // continuation lines (indented)
    let mm, offset = 0;
    // eslint-disable-next-line no-cond-assign
    while ((mm = contRe.exec(rest.slice(offset))) !== null) {
      lines.push(mm[1].trim());
      offset += mm.index + mm[0].length;
      // Stop if the next non-empty line looks like a new "Field: value"
      const ahead = rest.slice(offset);
      const nextField = /^\s*\w[\w\s-]+:\s+\S/m.test(ahead);
      if (nextField) break;
    }
    return lines.join(" ");
  };

  const sysName     = captureWrapped("System Name", sys);
  const sysContact  = captureWrapped("System Contact", sys);
  const sysLocation = captureWrapped("System Location", sys);
  const sysDescr    = captureWrapped("System Description", sys);

  if (sysName) device.set("name", sysName);
  if (sysContact) device.set("contact", sysContact);
  if (sysLocation) device.set("location", sysLocation);

  /* -------- Inventory -> Modules/Model/Serial -------- */
  let inv = ""; try { inv = cli.command("show inventory"); } catch (e) {}
  const mModel = inv.match(/^\s*PID:\s+(\S+)/mi);
  if (mModel) device.set("model", mModel[1].trim());
  const mSerial = inv.match(/\bSN:\s+(\S+)/i);
  if (mSerial) device.set("serialNumber", mSerial[1].trim());

  if (inv) {
    // Example block:
    // NAME: "1"  DESCR: "Catalyst 1200 Series Smart Switch, 16-port GE, 2x1G SFP (C1200-16T-2G)"
    // PID: C1200-16T-2G  VID:  V03  SN: DNI123456AB
    const r = /NAME:\s*"([^"]+)"\s+DESCR:\s*"([^"]+)"[\s\r\n]+PID:\s*([^\s]+)\s+VID:\s*([^\s]+)\s+SN:\s*([^\s]+)/gmi;
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = r.exec(inv)) !== null) {
      const mod = {
        slot: m[1].trim(),
        description: m[2].trim(),
        partNumber: m[3].trim(),
        hardwareVersion: m[4].trim(),
        serialNumber: m[5].trim()
      };
      addModuleOnce(device, mod);
    }
  }

  /* -------- Version -------- */
  let ver = ""; try { ver = cli.command("show version"); } catch (e) {}
  const mVer = ver.match(/^\s*Version:\s*([\w.\-]+)/mi) ||
               ver.match(/Active-image:.*?_([\w.\-]+)[_.]/i);
  if (mVer) {
    const verStr = mVer[1].trim();
    config.set("firmwareVersion", verStr);
    device.set("softwareVersion", verStr);
  }

  /* -------- Family (from system/inventory) -------- */
  const rawInvDescr = (() => {
    const mm = inv.match(/NAME:\s*"[^"]+"\s+DESCR:\s*"([^"]+)"/i);
    return mm ? mm[1].trim() : "";
  })();

  const deriveFamily = desc => {
    if (!desc) return "";
    // Trim at first parenthesis and the first comma segment is the “family-ish” bit.
    const noParen = desc.split("(")[0];
    const firstPart = noParen.split(",")[0].trim();
    return firstPart || noParen.trim();
  };

  const famFromSys = deriveFamily(sysDescr);
  const famFromInv = deriveFamily(rawInvDescr);
  const family = famFromSys || famFromInv || "Cisco Catalyst (Next-Gen)";
  device.set("family", family);
  device.set("networkClass", "SWITCH");

  /* -------- Running-config -------- */
  let runCfg = ""; try { runCfg = cli.command("show running-config"); } catch (e) {}
  if (runCfg) {
    config.set("runningConfig", runCfg);
    const hn = runCfg.match(/^\s*hostname\s+(\S+)/mi);
    if (hn) device.set("name", hn[1]);
  }

  // Fallbacks for Location/Contact if not fully present in "show system"
  if ((!sysLocation || !sysContact) && runCfg) {
    if (!sysLocation) {
      const mLoc = runCfg.match(/^\s*snmp-server\s+location\s+(.+)\s*$/mi);
      if (mLoc) device.set("location", mLoc[1].trim());
    }
    if (!sysContact) {
      const mCon = runCfg.match(/^\s*snmp-server\s+contact\s+(.+)\s*$/mi);
      if (mCon) device.set("contact", mCon[1].trim());
    }
  }

  /* -------- Interfaces: descriptions -------- */
  let ifDescOut = ""; try { ifDescOut = cli.command("show interfaces description"); } catch (e) {}
  const physDesc = {};
  const namesFromDesc = [];
  (ifDescOut || "").split(/\r?\n/).forEach(line => {
    const mm = line.match(/^(gi\d+|te\d+|fa\d+|eth\d+|Po\d+)\s+(.*)$/i);
    if (mm) {
      const n = mm[1].toLowerCase();
      physDesc[n] = (mm[2] || "").trim();
      namesFromDesc.push(n);
    }
  });

  /* -------- Interfaces: admin/oper states -------- */
  let ifCfgOut = ""; try { ifCfgOut = cli.command("show interfaces configuration"); } catch (e) {}
  const physState = {};
  const poState = {};
  const namesFromCfg = [];
  (ifCfgOut || "").split(/\r?\n/).forEach(line => {
    const l = line.replace(/\s{2,}/g, " ").trim();

    const mp = l.match(/^(gi\d+|te\d+|fa\d+|eth\d+)\s+\S+\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i);
    if (mp) {
      const n = mp[1].toLowerCase();
      const enabled = /^Enabled$/i.test(mp[2]);
      const operUp  = /^Up$/i.test(mp[3]);
      physState[n] = { enabled, adminStatus: enabled ? "Up" : "Down", linkStatus: operUp ? "Up" : "Down" };
      namesFromCfg.push(n);
      return;
    }

    const mc = l.match(/^(Po\d+)\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i) ||
               l.match(/^(Po\d+)\s+\S+\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i);
    if (mc) {
      const pn = mc[1].toLowerCase();
      const pen = /^Enabled$/i.test(mc[2]);
      const pop = /^Up$/i.test(mc[3]);
      poState[pn] = { enabled: pen, adminStatus: pen ? "Up" : "Down", linkStatus: pop ? "Up" : "Down" };
      namesFromCfg.push(pn);
    }
  });

  // Sort interfaces in natural order
  const natKey = n => (n || "").replace(/\d+/g, x => (`00000${x}`).slice(-5)).toLowerCase();
  const seen = {};
  const physOrder = [];
  const poOrder = [];
  namesFromDesc.concat(namesFromCfg).forEach(n => {
    if (seen[n]) return; seen[n] = true;
    if (/^(gi\d+|te\d+|fa\d+|eth\d+)$/i.test(n)) physOrder.push(n);
    else if (/^po\d+$/i.test(n)) poOrder.push(n);
  });
  physOrder.sort((a,b) => (natKey(a) < natKey(b) ? -1 : 1));
  poOrder.sort((a,b) => (natKey(a) < natKey(b) ? -1 : 1));

  /* -------- SVI IPs -------- */
  let ipIf = ""; try { ipIf = cli.command("show ip interface"); } catch (e) {}
  const sviIpMap = {};
  (ipIf || "").split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([0-9.]+)\/(\d+)\s+vlan\s+(\d+)\s+[A-Z]+\/[A-Z]+/i);
    if (m) {
      const ip = m[1]; const mask = parseInt(m[2], 10); const vlan = parseInt(m[3], 10);
      const sviName = `Vlan${vlan}`;
      if (!sviIpMap[sviName]) sviIpMap[sviName] = [];
      sviIpMap[sviName].push({ ip, mask, usage: "PRIMARY" });
    }
  });

  /* -------- Self MAC per VLAN -------- */
  let macTbl = ""; try { macTbl = cli.command("show mac address-table"); } catch (e) {}
  const vlanSelfMac = {};
  (macTbl || "").split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*(\d+)\s+([0-9a-f:\-\.]{12,})\s+0\s+self\s*$/i);
    if (m) vlanSelfMac[parseInt(m[1], 10)] = m[2]; // keep device format (dashes/colons/dots)
  });

  /* -------- Physical interfaces -------- */
  for (let i = 0; i < physOrder.length; i += 1) {
    const n = physOrder[i];
    const st = physState[n] || { enabled: false, adminStatus: "Down", linkStatus: "Down" };
    let o = ensureIfaceShape({
      name: n,
      description: physDesc[n] || "",
      level3: false,
      enabled: !!st.enabled,
      adminStatus: st.adminStatus,
      linkStatus: st.linkStatus,
      ip: []
    }, n, false);
    o = scrubMacs(o);
    if (o) addIfaceOnce(device, o);
  }

  /* -------- Port-channels -------- */
  for (let j = 0; j < poOrder.length; j += 1) {
    const pn = poOrder[j];
    const pst = poState[pn] || { enabled: false, adminStatus: "Down", linkStatus: "Down" };
    let po = ensureIfaceShape({
      name: pn,
      description: physDesc[pn] || "",
      level3: false,
      enabled: !!pst.enabled,
      adminStatus: pst.adminStatus,
      linkStatus: pst.linkStatus,
      ip: []
    }, pn, false);
    po = scrubMacs(po);
    if (po) addIfaceOnce(device, po);
  }

  /* -------- SVIs -------- */
  const sviNames = Object.keys(sviIpMap).sort(
    (a, b) => (parseInt(a.replace(/\D/g, "") || "0", 10) - parseInt(b.replace(/\D/g, "") || "0", 10))
  );

  for (let s = 0; s < sviNames.length; s += 1) {
    const svi = sviNames[s];
    const vlanId = parseInt(svi.replace(/\D/g, "") || "0", 10);
    const ips = sviIpMap[svi] || [];
    const mac = vlanSelfMac[vlanId];

    const baseSvi = {
      name: svi,
      description: "",
      level3: true,
      enabled: true,
      adminStatus: "Up",
      linkStatus: "Up",
      ip: ips
    };
    if (mac) {
      baseSvi.mac = mac;
      baseSvi.macAddress = mac;
    }

    let o3 = ensureIfaceShape(baseSvi, svi, true);
    o3 = scrubMacs(o3);
    if (o3) addIfaceOnce(device, o3);
  }

  /* -------- Hash -------- */
  if (typeof config.computeHash === "function") {
    // Reuse version in hash to avoid noisy diffs when firmware changes.
    const verStr = (mVer && mVer[1]) ? mVer[1] : "";
    config.computeHash(runCfg || "", null, verStr);
  }
}

/* ========================= ANALYZERS ========================= */

const analyzeSyslog = (/* message */) => false;
const analyzeTrap = (/* trap, debug */) => false;

/* ========================= SNMP AUTO-DISCOVERY ========================= */

const snmpAutoDiscover = (sysObjectID, sysDesc) => {
  const oid  = String(sysObjectID || "");
  const desc = String(sysDesc || "");

  // Must be a Cisco product leaf OID
  if (!/^1\.3\.6\.1\.4\.1\.9\.1\.\d+$/.test(oid)) return false;

  // If description is missing, don’t guess
  if (!desc.trim()) return false;

  // Hard excludes: avoid classic Cisco platforms
  if (/\b(IOS\s*XE|IOS\s+Software|NX-OS|ASA|Adaptive Security Appliance|IOS\s*XR)\b/i.test(desc)) {
    return false;
  }

  // Positive identifiers for Catalyst 1200/1300
  const familyHit =
    /\bCatalyst\s*1200\b/i.test(desc) ||
    /\bCatalyst\s*1300\b/i.test(desc) ||
    /\bC1200-\S+\b/i.test(desc) ||   // e.g., C1200-16T-2G
    /\bC1300-\S+\b/i.test(desc);

  return !!familyHit;
};
