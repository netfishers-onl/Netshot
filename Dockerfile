FROM ghcr.io/graalvm/graalvm-ce:java11-21.2.0 as builder
COPY . /opt/netshot
WORKDIR /opt/netshot
RUN gu install python
RUN ./mvnw package


FROM ghcr.io/graalvm/graalvm-ce:java11-21.2.0
RUN gu install python
RUN mkdir /usr/local/netshot /var/log/netshot
COPY --from=0 /opt/netshot/target/netshot.jar /usr/local/netshot/netshot.jar
COPY dist/netshot.conf.docker /etc/netshot.conf
EXPOSE 8080
CMD ["/usr/bin/java", "-jar", "/usr/local/netshot/netshot.jar"]
