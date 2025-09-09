/**
 * Cisco Catalyst Next-Gen Series (Cisco Business-like CLI) Driver for Netshot
 * Target: Catalyst 1200 Series (e.g., C1200-16T-2G)
 *
 * Author: David Micallef (Pizu)
 * Version: 1.0
 */

/* ========================= DRIVER META ========================= */

var Info = {
  name: "CiscoNextGenSeries",
  description: "Cisco Catalyst Next-Gen Series",
  author: "DMica(Pizu)",
  version: "1.1"
};

/* ========================= CONFIG MAP ========================= */

var Config = {
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
var Device = {};

/* ========================= CLI LAYER ========================= */

var ANSI = "(?:\\u001b\\[[0-9;]*[A-Za-z])*"; // permissive ANSI eater

var PROMPT_EXEC   = new RegExp("^" + ANSI + ".*>\\s?$", "m");                        // e.g. 'Switch>'
var PROMPT_ENABLE = new RegExp("^" + ANSI + ".*(?:\\(config[^)]*\\))?#\\s?$", "m");  // e.g. 'Switch#', 'Switch(config)#'

var PAGER_RE = new RegExp(
  "(?:^|\\r?\\n)" +
  "(?:" +
    "\\-\\-More\\-\\-" +              // --More--
    "|More:\\s*<space>.*" +           // More: <space> to continue, q to quit
    "|\\[?more\\]?\\s*$" +            // some odd lowercase variants
  ")",
  "mi"
);

var CLI = {
  ssh: {
    targets: [
      { prompt: /(User\s*Name|Username|login):\s*$/mi, response: "%username%", optional: true },
      { prompt: /Password:\s*$/mi, response: "%password%", optional: true },
      { prompt: /Press any key to continue\.{0,3}\s*$/mi, response: "\n", optional: true },
      { prompt: new RegExp(ANSI + ".*[>#]\\s?$", "m") }
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

function toCiscoDottedMac(s) {
  if (!s) return s;
  var hex = String(s).toLowerCase().replace(/[^0-9a-f]/g, "");
  if (hex.length !== 12) return s;
  return hex.slice(0,4) + "." + hex.slice(4,8) + "." + hex.slice(8,12);
}

function ensureIfaceShape(obj, fallbackName, isL3) {
  if (!obj || typeof obj !== "object") obj = {};
  obj.name = (obj.name != null ? String(obj.name) : String(fallbackName || "")).trim();
  if (!obj.name) return null;

  if (obj.description == null) obj.description = "";
  if (obj.level3 == null) obj.level3 = !!isL3;

  if (obj.enabled == null) obj.enabled = false;
  if (obj.adminStatus == null) obj.adminStatus = obj.enabled ? "Up" : "Down";
  if (obj.linkStatus == null) obj.linkStatus = obj.adminStatus;

  if (!Array.isArray(obj.ip)) obj.ip = [];
  obj.ip = obj.ip.filter(function (x) { return x && typeof x === "object" && (x.ip || x.address); });

  if (obj.level3) {
    if (obj.vrf == null) obj.vrf = "default";
  }
  else {
    if (obj.vrf != null) delete obj.vrf;
  }

  if (typeof obj.mac === "string") obj.mac = toCiscoDottedMac(obj.mac);
  if (!obj.mac) delete obj.mac;

  if (typeof obj.macAddress === "string") obj.macAddress = toCiscoDottedMac(obj.macAddress);
  if (!obj.macAddress) delete obj.macAddress;

  return obj;
}

function scrubMacs(o) {
  if (!o) return o;
  if (!o.mac) delete o.mac;
  if (!o.macAddress) delete o.macAddress;
  return o;
}

// Dedup guards
var addedIfaces = {};
function addIfaceOnce(device, kindObj) {
  if (!kindObj || !kindObj.name) return;
  var key = String(kindObj.name).toLowerCase();
  if (addedIfaces[key]) return;
  addedIfaces[key] = true;
  device.add("networkInterface", kindObj);
}

var addedModules = {};
function addModuleOnce(device, mod) {
  if (!mod) return;
  // Build a stable dedup key: slot|partNumber|serialNumber (lower-cased)
  var k = [
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
  try { cli.command(""); } catch (e) {}
  try { cli.command(""); } catch (e) {}

  try { cli.macro("enable"); } catch (e) {}

  // System
  var sys = ""; try { sys = cli.command("show system"); } catch (e) {}
  var mName = sys.match(/^\s*System Name:\s+([^\r\n]+)$/mi);
  if (mName) device.set("name", mName[1].trim());
  var mContact = sys.match(/^\s*System Contact:\s+(.+)$/mi);
  if (mContact) device.set("contact", mContact[1].trim());
  var mLocation = sys.match(/^\s*System Location:\s+(.+)$/mi);
  if (mLocation) device.set("location", mLocation[1].trim());

  // Inventory -> Modules
  var inv = ""; try { inv = cli.command("show inventory"); } catch (e) {}
  var mModel = inv.match(/^\s*PID:\s+(\S+)/mi);
  if (mModel) device.set("model", mModel[1].trim());
  var mSerial = inv.match(/^\s*SN:\s+(\S+)/mi);
  if (mSerial) device.set("serialNumber", mSerial[1].trim());

  if (inv) {
    // Example block:
    // NAME: "1"  DESCR: "Catalyst 1200 Series Smart Switch, 16-port GE, 2x1G SFP (C1200-16T-2G)"
    // PID: C1200-16T-2G  VID:  V03  SN: DNI123456AB
    var r = /NAME:\s*"([^"]+)"\s+DESCR:\s*"([^"]+)"[\s\r\n]+PID:\s*([^\s]+)\s+VID:\s*([^\s]+)\s+SN:\s*([^\s]+)/gmi;
    var m;
    while ((m = r.exec(inv)) !== null) {
      var mod = {
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
  var ver = ""; try { ver = cli.command("show version"); } catch (e) {}
  var mVer = ver.match(/^\s*Version:\s*([0-9.]+)/mi) || ver.match(/Active-image:.*?_([0-9.]+)[_.]/i);
  if (mVer) {
    config.set("firmwareVersion", mVer[1]);
    device.set("softwareVersion", mVer[1]);
  }

  device.set("family", "Cisco Catalyst 1200");
  device.set("networkClass", "SWITCH");

  // Running-config
  var runCfg = ""; try { runCfg = cli.command("show running-config"); } catch (e) {}
  if (runCfg) {
    config.set("runningConfig", runCfg);
    var hn = runCfg.match(/^\s*hostname\s+(\S+)/mi);
    if (hn) device.set("name", hn[1]);
  }

  // Interfaces: descriptions
  var ifDescOut = ""; try { ifDescOut = cli.command("show interfaces description"); } catch (e) {}
  var physDesc = {};
  var namesFromDesc = [];
  (ifDescOut || "").split(/\r?\n/).forEach(function (line) {
    var mm = line.match(/^(gi\d+|te\d+|fa\d+|eth\d+|Po\d+)\s+(.*)$/i);
    if (mm) {
      var n = mm[1].toLowerCase();
      physDesc[n] = (mm[2] || "").trim();
      namesFromDesc.push(n);
    }
  });

  // Interfaces: admin/oper states
  var ifCfgOut = ""; try { ifCfgOut = cli.command("show interfaces configuration"); } catch (e) {}
  var physState = {};
  var poState = {};
  var namesFromCfg = [];
  (ifCfgOut || "").split(/\r?\n/).forEach(function (line) {
    var l = line.replace(/\s{2,}/g, " ").trim();

    var mp = l.match(/^(gi\d+|te\d+|fa\d+|eth\d+)\s+\S+\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i);
    if (mp) {
      var n = mp[1].toLowerCase();
      var enabled = /^Enabled$/i.test(mp[2]);
      var operUp  = /^Up$/i.test(mp[3]);
      physState[n] = { enabled: enabled, adminStatus: enabled ? "Up" : "Down", linkStatus: operUp ? "Up" : "Down" };
      namesFromCfg.push(n);
      return;
    }

    var mc = l.match(/^(Po\d+)\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i) ||
             l.match(/^(Po\d+)\s+\S+\s+\S+\s+\S+\s+(Enabled|Disabled)\s+\S+\s+(Up|Down)/i);
    if (mc) {
      var pn = mc[1].toLowerCase();
      var pen = /^Enabled$/i.test(mc[2]);
      var pop = /^Up$/i.test(mc[3]);
      poState[pn] = { enabled: pen, adminStatus: pen ? "Up" : "Down", linkStatus: pop ? "Up" : "Down" };
      namesFromCfg.push(pn);
      return;
    }
  });

  function natKey(n) { return (n || "").replace(/\d+/g, function(x){return ("00000"+x).slice(-5);}).toLowerCase(); }
  var seen = {}, physOrder = [], poOrder = [];
  namesFromDesc.concat(namesFromCfg).forEach(function(n){
    if (seen[n]) return; seen[n] = true;
    if (/^(gi\d+|te\d+|fa\d+|eth\d+)$/i.test(n)) physOrder.push(n);
    else if (/^po\d+$/i.test(n)) poOrder.push(n);
  });
  physOrder.sort(function(a,b){ return natKey(a) < natKey(b) ? -1 : 1; });
  poOrder.sort(function(a,b){ return natKey(a) < natKey(b) ? -1 : 1; });

  // SVI IPs
  var ipIf = ""; try { ipIf = cli.command("show ip interface"); } catch (e) {}
  var sviIpMap = {};
  (ipIf || "").split(/\r?\n/).forEach(function(line){
    var m = line.match(/^\s*([0-9.]+)\/(\d+)\s+vlan\s+(\d+)\s+[A-Z]+\/[A-Z]+/i);
    if (m) {
      var ip = m[1], mask = parseInt(m[2], 10), vlan = parseInt(m[3],10);
      var sviName = "Vlan" + vlan;
      if (!sviIpMap[sviName]) sviIpMap[sviName] = [];
      sviIpMap[sviName].push({ ip: ip, mask: mask, usage: "PRIMARY" });
    }
  });

  // Self MAC per VLAN
  var macTbl = ""; try { macTbl = cli.command("show mac address-table"); } catch (e) {}
  var vlanSelfMac = {};
  (macTbl || "").split(/\r?\n/).forEach(function(line){
    var m = line.match(/^\s*(\d+)\s+([0-9a-f:\-\.]{12,})\s+0\s+self\s*$/i);
    if (m) vlanSelfMac[parseInt(m[1],10)] = toCiscoDottedMac(m[2]);
  });

  // Physical interfaces
  for (var i = 0; i < physOrder.length; i++) {
    var n = physOrder[i];
    var st = physState[n] || { enabled: false, adminStatus: "Down", linkStatus: "Down" };
    var o = ensureIfaceShape({
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
  for (var j = 0; j < poOrder.length; j++) {
    var pn = poOrder[j];
    var pst = poState[pn] || { enabled: false, adminStatus: "Down", linkStatus: "Down" };
    var po = ensureIfaceShape({
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
  var sviNames = Object.keys(sviIpMap).sort(function(a,b){
    return (parseInt(a.replace(/\D/g,"")||"0",10) - parseInt(b.replace(/\D/g,"")||"0",10));
  });
  for (var s = 0; s < sviNames.length; s++) {
    var svi = sviNames[s];
    var vlanId = parseInt(svi.replace(/\D/g,"")||"0",10);
    var ips = sviIpMap[svi] || [];
    var mac = vlanSelfMac[vlanId];

    var baseSvi = {
      name: svi,
      description: "",
      level3: true,
      enabled: true,
      adminStatus: "Up",
      linkStatus: "Up",
      ip: ips,
      vrf: "default"
    };
    if (mac) {
      baseSvi.mac = mac;
      baseSvi.macAddress = mac;
    }

    var o3 = ensureIfaceShape(baseSvi, svi, true);
    o3 = scrubMacs(o3);
    if (o3) addIfaceOnce(device, o3);
  }

  // Hash
  if (typeof config.computeHash === "function") {
    var verStr = (mVer && mVer[1]) ? mVer[1] : "";
    config.computeHash(runCfg || "", null, verStr);
  }
}

/* ========================= ANALYZERS ========================= */

function analyzeSyslog(message) { return false; }
function analyzeTrap(trap, debug) { return false; }

/* ========================= SNMP AUTO-DISCOVERY ========================= */

function snmpAutoDiscover(sysObjectID, sysDesc) {
  if (sysObjectID === "1.3.6.1.4.1.9.1.3214") return true; // exact C1200
  if (/^1\.3\.6\.1\.4\.1\.9\./.test(sysObjectID || "") && /Catalyst\s*1200/i.test(sysDesc || "")) return true; // soft match
  return false;
}
