ARG NETSHOT_VERSION=0.0.1-dev
ARG GRAALVM_VERSION=21.0.6
ARG GRAALPY_VERSION=24.2.1

FROM debian:12 AS debian-graalvm
ARG GRAALVM_VERSION
ARG GRAALPY_VERSION
RUN apt-get -y update && apt-get -y install wget fontconfig
WORKDIR /usr/lib/jvm
RUN wget --quiet https://download.oracle.com/graalvm/${GRAALVM_VERSION%%.*}/archive/graalvm-jdk-${GRAALVM_VERSION}_linux-x64_bin.tar.gz && \ 
    tar xvzf graalvm-jdk-${GRAALVM_VERSION}_linux-x64_bin.tar.gz && \
    rm -f graalvm-jdk-${GRAALVM_VERSION}_linux-x64_bin.tar.gz && \
    JDIR=$(ls -d graalvm-jdk-${GRAALVM_VERSION}* | tail -n 1) && \
    mkdir ${JDIR}/languages && \
    update-alternatives --install /usr/bin/java java /usr/lib/jvm/${JDIR}/bin/java 92100
RUN wget --quiet https://github.com/oracle/graalpython/releases/download/graal-${GRAALPY_VERSION}/graalpy-jvm-${GRAALPY_VERSION}-linux-amd64.tar.gz && \
    tar xvzf graalpy-jvm-${GRAALPY_VERSION}-linux-amd64.tar.gz && \
    rm -f graalpy-jvm-${GRAALPY_VERSION}-linux-amd64.tar.gz && \
    mv graalpy-${GRAALPY_VERSION}-linux-amd64 graalpy

FROM debian-graalvm AS builder
ARG NETSHOT_VERSION
COPY . /build
WORKDIR /build
RUN sed -i -r "s/VERSION = \".*\";/VERSION = \"$NETSHOT_VERSION\";/g" \
       src/main/java/net/netshot/netshot/Netshot.java
RUN ./mvnw package -Dmaven.test.skip

FROM debian-graalvm
RUN mkdir /usr/local/netshot /var/log/netshot
COPY --from=builder /build/target/netshot.jar /usr/local/netshot/netshot.jar
COPY dist/netshot.conf.docker /etc/netshot.conf
EXPOSE 8080
CMD ["/usr/bin/java", "-jar", "/usr/local/netshot/netshot.jar"]
