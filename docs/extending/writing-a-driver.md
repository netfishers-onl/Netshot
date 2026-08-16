# Writing a new driver for Netshot

## Introduction

Netshot uses drivers to talk to the network equipment. These drivers are JavaScript files. Netshot is distributed with a number of drivers, but anyone may write and load new drivers.

## Information to collect

Before writing any code, you need to get answers for all the following questions.

!!! note
    For a better understanding, examples of answers are given for the Cisco IOS driver.

**What is the name of the vendor?**

> Cisco

**What is the name of the operating system?**

> IOS

**Assuming SNMP is configured on the device, what is the result of the following command (executed on an allowed NMS)?**

```bash
snmpwalk -v2c -c [community] [IP of the device] 1.3.6.1.2.1.1
```

```text
iso.3.6.1.2.1.1.1.0 = STRING: "Cisco IOS Software, C3750 Software (C3750-IPSERVICESK9-M), Version 15.0(2)SE9, RELEASE SOFTWARE (fc1)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2015 by Cisco Systems, Inc.
Compiled Tue 01-Dec-15 07:02 by prod_rel_team"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.9.1.516
iso.3.6.1.2.1.1.3.0 = Timeticks: (279047790) 32 days, 7:07:57.90
iso.3.6.1.2.1.1.4.0 = ""
iso.3.6.1.2.1.1.5.0 = STRING: "switch1.lab.sqdqsd.net"
iso.3.6.1.2.1.1.6.0 = STRING: "observium"
iso.3.6.1.2.1.1.7.0 = INTEGER: 6
iso.3.6.1.2.1.1.8.0 = Timeticks: (0) 0:00:00.00
iso.3.6.1.2.1.1.9.1.2.1 = OID: iso.3.6.1.4.1.9.7.129
iso.3.6.1.2.1.1.9.1.2.2 = OID: iso.3.6.1.4.1.9.7.115
...
```

**If telnet is possible on this kind of device, enable it and capture the full sequence of login (copy/paste of the console).**

```text
toto@bla:~$ telnet 10.1.1.1
Trying 10.1.1.1...
Connected to 10.1.1.1.
Escape character is '^]'.

User Access Verification

Username: mqlskd
Password:
% Login invalid

Username: admin
Password:
switch1.lab#
```

**Capture the full sequence of login via SSH (copy/paste the content of the console).**

```text
toto@bla:~$ ssh user1@10.1.1.1
Password:

switch1.lab#
```

**What are the possible prompts (e.g. exec disable, exec enable, configuration mode) and how to switch from one to another?**

```text
switch1.lab#disable
switch1.lab>enable
Password:
switch1.lab#conf t
Enter configuration commands, one per line.  End with CNTL/Z.
switch1.lab(config)#end
switch1.lab#
```

**Type an unknown command and capture the output. (This is to recognize errors.)**

```text
switch1.lab#lkqjsd
Translating "lkqjsd"
% Unknown command or computer name, or unable to find computer address
switch1.lab#a
% Ambiguous command:  "a"
```

**What is the important information to capture whenever running a snapshot, and what is the associated CLI command?**

> Each config:
>
> * Running-config (`show running-config`)
> * IOS image file (taken from `show version`)
> * IOS version (taken from `show version`)

> Device level (no history):
>
> * Main memory size (taken from `show version`)
> * Config register (taken from `show version`)
> * Configuration saved (compare `show running` and `show startup`)

**Provide a full example of each of these items.**

**Is there any paging system when displaying a long output? Capture it.**

**What is the key to press to go on?**

**Is there any command available to totally disable the paging without altering the configuration?**

> Yes, `--More--` like this:
>
> ```text
> !
> ip vrf VRF270
>  rd 270:270
> !
>  --More--
> ```
>
> Press space to go on.
>
> Type `terminal length 0` to avoid it.

**Is there a way to recognize the name of the user who made the last configuration change to the device?**

> Yes, by looking at the first line in `show run`:
> `! Last configuration change at 18:13:06 UTC Tue Aug 21 2018 by user1`

**Is there any virtualization aspect on the device? (e.g. VDC)**

> No

**How to find out the name of the device?**

> Look for `... Uptime` in `show version`

**How to find out the contact for the device?**

> Look for `snmp-server contact` in the running-config

**How to find out the location of the device?**

> Look for `snmp-server location` in the running-config

**How to find out the software version of the device?**

> Look at `show version`

**How to find out the family of the device?**

> Look at `show version`

**How to retrieve the hardware inventory of the device?**

> Use `show inventory`

**How to find out the main serial number of the device?**

> Processor board ID in `show version`

**How to find out the list of L2/L3 interfaces of the device? With the associated IP address, the associated MAC address, the VRF, the admin status.**

> Look at `interface` blocks in the configuration. Use `show interface X` to retrieve the MAC address.

```text
switch1.lab#show interfaces GigabitEthernet 1/0/1
GigabitEthernet1/0/1 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 0021.a16d.9481 (bia 0021.a16d.9481)
...
```

**Upon configuration change, will the device generate a specific Syslog message?**

> Yes, `%SYS-5-CONFIG_I: Configured from console by user1`.

**Upon configuration change, will the device generate a specific SNMP trap?**

> Yes, OID `1.3.6.1.4.1.9.9.43.1.1.6.1.5` with value 3.

## Writing the driver

Once you have gathered the answers above, you have everything needed to start writing the JavaScript driver itself. Use one of the drivers bundled with Netshot as a template, and adapt each section (connection, snapshot, compliance/inventory hooks) based on the answers you collected.
