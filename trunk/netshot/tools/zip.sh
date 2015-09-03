#!/bin/sh

echo "@@@ Switch to main directory"
cd "$(dirname "$0")"
cd ..
echo "@@@ Update using SVN" 
svn up

VERSION_CODE=`sed -nr 's/.* String VERSION *= *"(.*?)".*/\1/p' src/main/java/onl/netfishers/netshot/Netshot.java`
VERSION_POM=`cat pom.xml | tr -d '\r\n' | sed -r 's/.*<artifactId>netshot<\/artifactId>[ \t]*<version>([^<]+)<\/version>.*/\1/'`

if [ "$VERSION_CODE" != "$VERSION_POM" ]; then
	echo "@@@ The Netshot version in code doesn't match the version in pom.xml"
	exit 1;
fi

VERSION="$VERSION_CODE"

echo "@@@ Build using Maven"
mvn clean
mvn package

if [ $? -ne 0 ]; then
	echo "@@@ The build failed"
	exit 1;
fi

cd target
rm -rf zip
mkdir zip
cd zip
mv ../netshot.jar .
cp ../../dist/* .
echo "Netshot version $VERSION" > VERSION.txt
cp ../../src/main/resources/www/LICENSE.txt .

ZIPFILE="netshot_${VERSION}.zip"

zip "$ZIPFILE" *

echo "@@@ Your package is ready: "
realpath "$ZIPFILE"

