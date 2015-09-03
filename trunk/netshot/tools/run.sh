#!/bin/sh

java -classpath ./js.jar:./compiler.jar org.mozilla.javascript.tools.shell.Main ./r.js -o build.js
