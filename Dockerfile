FROM maven:3-jdk-11 AS builder
COPY . /opt/netshot
WORKDIR /opt/netshot
RUN mvn package


FROM oracle/graalvm-ce:20.3.0-java11
RUN gu install python
RUN mkdir /usr/local/netshot /var/log/netshot
COPY --from=0 /opt/netshot/target/netshot.jar /usr/local/netshot/netshot.jar
COPY dist/netshot.conf.docker /etc/netshot.conf
EXPOSE 8080
CMD ["/usr/bin/java", "-jar", "/usr/local/netshot/netshot.jar"]
