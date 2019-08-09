FROM openliberty/open-liberty:springBoot2-ubi-min as staging
USER root
COPY spring-petclinic/target/spring-petclinic-2.1.0.BUILD-SNAPSHOT.jar /staging/fatClinic.jar

RUN springBootUtility thin \
 --sourceAppPath=/staging/fatClinic.jar \
 --targetThinAppPath=/staging/thinClinic.jar \
 --targetLibCachePath=/staging/lib.index.cache

FROM openliberty/open-liberty:springBoot2-ubi-min
USER root
COPY --from=staging /staging/lib.index.cache /opt/ol/wlp/usr/shared/resources/lib.index.cache
COPY --from=staging /staging/thinClinic.jar /config/dropins/spring/thinClinic.jar

RUN chown -R 1001.0 /config && chmod -R g+rw /config
RUN chown -R 1001.0 /opt/ol/wlp/usr/shared/resources/lib.index.cache && chmod -R g+rw /opt/ol/wlp/usr/shared/resources/lib.index.cache

USER 1001
