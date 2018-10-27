# Build Instruction

## Build

* install Maven
* run : `mvn package`

----

## Check CVE alerts:
* run: `mvn verify`

----

## Update dependencies to latest versions
* run: `mvn versions:use-latest-releases` 

----

## Notes:

pom-rules.xml file avoid using alpha or beta dependencies.
Hybernate 5.X is incompatible with current project. So version 4.x is forced in rules
