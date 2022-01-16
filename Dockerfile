FROM ghcr.io/graalvm/graalvm-ce:java11-21.3.0 as builder

COPY ./src /opt/netshot/src
COPY ./tools /opt/netshot/tools
#COPY ./.settings /opt/netshot/.settings
COPY ./mvnw /opt/netshot/mvnw
COPY ./pom.xml /opt/netshot/pom.xml
COPY ./Netshot.svg /opt/netshot/Netshot.svg
COPY ./.mvn /opt/netshot/.mvn


WORKDIR /opt/netshot
RUN gu install python
RUN ./mvnw package


FROM ghcr.io/graalvm/graalvm-ce:java11-21.3.0
RUN gu install python
RUN mkdir /usr/local/netshot /var/log/netshot
COPY --from=0 /opt/netshot/target/netshot.jar /usr/local/netshot/netshot.jar
COPY dist/netshot.conf.docker /etc/netshot.conf
EXPOSE 8080
CMD ["/usr/bin/java", "-jar", "/usr/local/netshot/netshot.jar"]
