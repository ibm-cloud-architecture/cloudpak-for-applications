FROM openliberty/open-liberty:springBoot2-ubi-min
USER root
COPY spring-petclinic/target/spring-petclinic-2.1.0.BUILD-SNAPSHOT.jar /config/dropins/spring/
RUN chown -R 1001.0 /config
USER 1001
