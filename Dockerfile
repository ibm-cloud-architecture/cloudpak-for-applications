FROM openliberty/open-liberty:springBoot2-ubi-min
COPY --chown=1001:0 spring-petclinic/target/spring-petclinic-2.1.0.BUILD-SNAPSHOT.jar /config/dropins/spring/
