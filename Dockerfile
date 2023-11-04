ARG NETSHOT_VERSION=0.0.1-dev
ARG GRAALVM_VERSION=17.0.8

FROM ghcr.io/graalvm/graalvm-community:${GRAALVM_VERSION} AS builder
ARG NETSHOT_VERSION
RUN gu install js python
COPY . /build
WORKDIR /build
RUN echo $NE
RUN sed -i -r "s/VERSION = \".*\";/VERSION = \"$NETSHOT_VERSION\";/g" \
       src/main/java/onl/netfishers/netshot/Netshot.java
RUN ./mvnw versions:set -DnewVersion=$NETSHOT_VERSION -f pom.xml
RUN ./mvnw package


FROM ghcr.io/graalvm/graalvm-community:${GRAALVM_VERSION}
RUN gu install js python
RUN mkdir /usr/local/netshot /var/log/netshot
COPY --from=0 /build/target/netshot.jar /usr/local/netshot/netshot.jar
COPY dist/netshot.conf.docker /etc/netshot.conf
EXPOSE 8080
CMD ["/usr/bin/java", "-jar", "/usr/local/netshot/netshot.jar"]
