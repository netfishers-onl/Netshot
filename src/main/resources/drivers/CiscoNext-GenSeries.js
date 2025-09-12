/**
 * Cisco Catalyst Next-Gen Series (Cisco Business-like CLI) Driver for Netshot
 * Target: Catalyst 1200 Series (e.g., C1200-16T-2G)
 *
 * Author: David Micallef (Pizu)
 * Version: 1.0
 */

/* ========================= DRIVER META ========================= */

const Info = {
  name: "CiscoNextGenSeries",
  description: "Cisco Catalyst Next-Gen Series",
  author: "DMica(Pizu)",
  version: "1.1"
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

const PROMPT_EXEC   = /^.*>\s?$/m;                        // e.g. 'Switch>'
const PROMPT_ENABLE = /^.*(?:\(config[^)]*\))?#\s?$/m;    // e.g. 'Switch#' or 'Switch(config)#'

const PAGER_RE = new RegExp(
  "(?:^|\\r?\\n)" +
  "(?:" +
    "\\-\\-More\\-\\-" +              // --More--
    "|More:\\s*<space>.*" +           // More: <space> to continue, q to quit
    "|\\[?more\\]?\\s*$" +            // some odd lowercase variants
  ")",
  "mi"
);

const CLI = {
  ssh: {
    targets: [
      { prompt: /(User\s*Name|Username|login):\s*$/mi, response: "%username%", optional: true },
      { prompt: /Password:\s*$/mi, response: "%password%", optional: true },
      { prompt: /Press any key to continue\.{0,3}\s*$/mi, response: "\n", optional: true },
      { prompt: /[>#]\s?$/m }   // capture the prompt tail
    ],
    macros: {
      enable: { options: ["enable"], target: "enable" }
    }
  },

  exec: {
    prompt: PROMPT_EXEC,
    pager: {
      match: PAGER_RE,
      response: " "
    }
  },

  enable: {
    prompt: PROMPT_ENABLE,
    commands: [
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

  // Just drop empty MAC keys; keep whatever format the device prints (dashes/colons/dots)
  if (!obj.mac) delete obj.mac;
  if (!obj.macAddress) delete obj.macAddress;

  return obj;
};

function scrubMacs(o) {
  if (!o) return o;
  if (!o.mac) delete o.mac;
  if (!o.macAddress) delete o.macAddress;
  return o;
}

// Dedup guards
const addedIfaces = {};
function addIfaceOnce(device, kindObj) {
  if (!kindObj || !kindObj.name) return;
  const key = String(kindObj.name).toLowerCase();
  if (addedIfaces[key]) return;
  addedIfaces[key] = true;
  device.add("networkInterface", kindObj);
}

const addedModules = {};
function addModuleOnce(device, mod) {
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
}

/* ========================= SNAPSHOT ========================= */

function snapshot(cli, device, config) {
  // Switch from ssh to enable mode immediately
  try { cli.macro("enable"); } catch (e) {}

  // System
  let sys = ""; try { sys = cli.command("show system"); } catch (e) {}
  const mName = sys.match(/^\s*System Name:\s+([^\r\n]+)$/mi);
  if (mName) device.set("name", mName[1].trim());
  const mContact = sys.match(/^\s*System Contact:\s+(.+)$/mi);
  if (mContact) device.set("contact", mContact[1].trim());
  const mLocation = sys.match(/^\s*System Location:\s+(.+)$/mi);
  if (mLocation) device.set("location", mLocation[1].trim());

  // Inventory -> Modules
  let inv = ""; try { inv = cli.command("show inventory"); } catch (e) {}
  const mModel = inv.match(/^\s*PID:\s+(\S+)/mi);
  if (mModel) device.set("model", mModel[1].trim());
  const mSerial = inv.match(/^\s*SN:\s+(\S+)/mi);
  if (mSerial) device.set("serialNumber", mSerial[1].trim());

  if (inv) {
    // Example block:
    // NAME: "1"  DESCR: "Catalyst 1200 Series Smart Switch, 16-port GE, 2x1G SFP (C1200-16T-2G)"
    // PID: C1200-16T-2G  VID:  V03  SN: DNI123456AB
    const r = /NAME:\s*"([^"]+)"\s+DESCR:\s*"([^"]+)"[\s\r\n]+PID:\s*([^\s]+)\s+VID:\s*([^\s]+)\s+SN:\s*([^\s]+)/gmi;
    let m;
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

  // Version
  let ver = ""; try { ver = cli.command("show version"); } catch (e) {}
  const mVer = ver.match(/^\s*Version:\s*([0-9.]+)/mi) || ver.match(/Active-image:.*?_([0-9.]+)[_.]/i);
  if (mVer) {
    config.set("firmwareVersion", mVer[1]);
    device.set("softwareVersion", mVer[1]);
  }

  device.set("family", "Cisco Catalyst 1200");
  device.set("networkClass", "SWITCH");

  // Running-config
  let runCfg = ""; try { runCfg = cli.command("show running-config"); } catch (e) {}
  if (runCfg) {
    config.set("runningConfig", runCfg);
    const hn = runCfg.match(/^\s*hostname\s+(\S+)/mi);
    if (hn) device.set("name", hn[1]);
  }

  // Interfaces: descriptions
  let ifDescOut = ""; try { ifDescOut = cli.command("show interfaces description"); } catch (e) {}
  const physDesc = {};
  const namesFromDesc = [];
  (ifDescOut || "").split(/\r?\n/).forEach(function (line) {
    const mm = line.match(/^(gi\d+|te\d+|fa\d+|eth\d+|Po\d+)\s+(.*)$/i);
    if (mm) {
      const n = mm[1].toLowerCase();
      physDesc[n] = (mm[2] || "").trim();
      namesFromDesc.push(n);
    }
  });

  // Interfaces: admin/oper states
  let ifCfgOut = ""; try { ifCfgOut = cli.command("show interfaces configuration"); } catch (e) {}
  const physState = {};
  const poState = {};
  const namesFromCfg = [];
  (ifCfgOut || "").split(/\r?\n/).forEach(function (line) {
    const l = line.replace(/\s{2,}/g, " ").trim();

    const mp = l.match(/^(gi\d+|te\d+|fa\d+|eth\d+)\s+\S+\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i);
    if (mp) {
      const n = mp[1].toLowerCase();
      const enabled = /^Enabled$/i.test(mp[2]);
      const operUp  = /^Up$/i.test(mp[3]);
      physState[n] = { enabled: enabled, adminStatus: enabled ? "Up" : "Down", linkStatus: operUp ? "Up" : "Down" };
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
      return;
    }
  });

  function natKey(n) { return (n || "").replace(/\d+/g, function(x){return ("00000"+x).slice(-5);}).toLowerCase(); }
  const seen = {}, physOrder = [], poOrder = [];
  namesFromDesc.concat(namesFromCfg).forEach(function(n){
    if (seen[n]) return; seen[n] = true;
    if (/^(gi\d+|te\d+|fa\d+|eth\d+)$/i.test(n)) physOrder.push(n);
    else if (/^po\d+$/i.test(n)) poOrder.push(n);
  });
  physOrder.sort(function(a,b){ return natKey(a) < natKey(b) ? -1 : 1; });
  poOrder.sort(function(a,b){ return natKey(a) < natKey(b) ? -1 : 1; });

  // SVI IPs
  let ipIf = ""; try { ipIf = cli.command("show ip interface"); } catch (e) {}
  const sviIpMap = {};
  (ipIf || "").split(/\r?\n/).forEach(function(line){
    const m = line.match(/^\s*([0-9.]+)\/(\d+)\s+vlan\s+(\d+)\s+[A-Z]+\/[A-Z]+/i);
    if (m) {
      const ip = m[1], mask = parseInt(m[2], 10), vlan = parseInt(m[3],10);
      const sviName = "Vlan" + vlan;
      if (!sviIpMap[sviName]) sviIpMap[sviName] = [];
      sviIpMap[sviName].push({ ip: ip, mask: mask, usage: "PRIMARY" });
    }
  });

  // Self MAC per VLAN
  let macTbl = ""; try { macTbl = cli.command("show mac address-table"); } catch (e) {}
  const vlanSelfMac = {};
  (macTbl || "").split(/\r?\n/).forEach(function(line){
    const m = line.match(/^\s*(\d+)\s+([0-9a-f:\-\.]{12,})\s+0\s+self\s*$/i);
    if (m) vlanSelfMac[parseInt(m[1],10)] = m[2]; // pass through unchanged
  });

  // Physical interfaces
  for (let i = 0; i < physOrder.length; i++) {
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

  // Port-channels
  for (let j = 0; j < poOrder.length; j++) {
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

  // SVIs
  const sviNames = Object.keys(sviIpMap).sort(function(a,b){
    return (parseInt(a.replace(/\D/g,"")||"0",10) - parseInt(b.replace(/\D/g,"")||"0",10));
  });
  for (let s = 0; s < sviNames.length; s++) {
    const svi = sviNames[s];
    const vlanId = parseInt(svi.replace(/\D/g,"")||"0",10);
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

  // Hash
  if (typeof config.computeHash === "function") {
    const verStr = (mVer && mVer[1]) ? mVer[1] : "";
    config.computeHash(runCfg || "", null, verStr);
  }
}

/* ========================= ANALYZERS ========================= */

function analyzeSyslog(message) { return false; }
function analyzeTrap(trap, debug) { return false; }

/* ========================= SNMP AUTO-DISCOVERY ========================= */

function snmpAutoDiscover(sysObjectID, sysDesc) {
  const oid  = String(sysObjectID || "");
  const desc = String(sysDesc || "");

  // Must be a Cisco product leaf OID
  if (!/^1\.3\.6\.1\.4\.1\.9\.1\.\d+$/.test(oid)) return false;

  // Known exacts (extend list as needed)
  const exactOids = new Set([
    "1.3.6.1.4.1.9.1.3214"   // Catalyst 1200 example
  ]);
  if (exactOids.has(oid)) return true;

  // Hard excludes: avoid classic Cisco platforms
  if (/\b(IOS\s*XE|IOS\s+Software|NX-OS|ASA|Adaptive Security Appliance|IOS XR)\b/i.test(desc)) {
    return false;
  }

  // Positive identifiers
  const familyHit =
    /Catalyst\s*1200/i.test(desc) ||
    /Catalyst\s*1300/i.test(desc) ||
    /\bC1200-\S+\b/i.test(desc)   ||   // e.g. C1200-16T-2G
    /\bC1300-\S+\b/i.test(desc);

  return familyHit;
}
