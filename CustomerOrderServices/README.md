
 ## Traditional WebSphere application modernized for Quarkus 


### Start application DB2 database in a pre-built container
```
docker run -itd --name db2-cos --privileged=true -p 50000:50000 -e LICENSE=accept -e DB2INST1_PASSWORD=db2inst1 -e DBNAME=orderdb vandepol/db2-cos
```

### Quarkus setup on Mac
https://quarkus.io/guides/building-native-image

List installed JDKs  
```
/usr/libexec/java_home -V  

Matching Java Virtual Machines (6):
    11.0.8, x86_64:	"GraalVM CE 19.3.3"	/Library/Java/JavaVirtualMachines/graalvm-ce-lts-java11-19.3.3/Contents/Home
    11.0.8, x86_64:	"GraalVM CE 20.2.0"	/Library/Java/JavaVirtualMachines/graalvm-ce-java11-20.2.0/Contents/Home
    11, x86_64:	"OpenJDK 11"	/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
    1.8.0_262+10, x86_64:	"GraalVM CE 20.2.0"	/Library/Java/JavaVirtualMachines/graalvm-ce-java8-20.2.0/Contents/Home
    1.8.0_262+10, x86_64:	"GraalVM CE 19.3.3"	/Library/Java/JavaVirtualMachines/graalvm-ce-lts-java8-19.3.3/Contents/Home
    1.8.0_251, x86_64:	"Java SE 8"	/Library/Java/JavaVirtualMachines/jdk1.8.0_251.jdk/Contents/Home
```

Setup env vars
```
export GRAALVM_HOME=/Library/Java/JavaVirtualMachines/graalvm-ce-java11-20.2.0/Contents/Home
export JAVA_HOME=${GRAALVM_HOME}
export PATH=${GRAALVM_HOME}/bin:$PATH
```

### Build and run application in Quarkus in JVM mode
```
./mvnw compile quarkus:dev
```  
Access the App
http://localhost:8080/

### Build and run application in native executable mode
```
./mvnw package -Pnative
target/customer-order-services-quarkus-1.0-SNAPSHOT-runner
```


Access the App
http://localhost:8080/



