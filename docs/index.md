# Reference Solution Implementations

Application modernization is a journey of moving existing applications to a more modern cloud-native infrastructure.
A high level overview of key application modernization concepts is available in the [Application Modernization Field Guide](https://www.ibm.com/cloud/garage/content/field-guide/app-modernization-field-guide/) and the IBM Architecture Center [Application Modernization reference architecture](https://www.ibm.com/cloud/garage/architectures/application-modernization/)

## Solutions

There are several approaches to application modernization and provided are key reference implementations for approaching your implementation

### Runtime modernization
* [Runtime modernization](./liberty/README.md) -- Updating the application runtime to a suitable cloud-native framework (Liberty) and deploying in Red Hat OpenShift. This solution shows different deployment options including using modern CI/CD tools (Tekton & ArgoCD) and using heritage CI/CD tools (Jenkins)

### Spring Framework modernization
* [Spring modernization](./spring/README.md) -- Updated a prior Spring application by updating to the latest Spring Boot and deploying in Red Hat OpenShift

### Operational modernization with Heritage CI/CD tools
* [Operation modernization](./was90/README.md) -- Repackaging the application to deploy within a container but maintaining a monolith application without changes to the application or runtime


## Additional Resources

* [Application Modernization](https://ibm-cloud-architecture.github.io/deliverables/application-modernization.html) assets
* [Installing](https://cloudpak8s.io/apps/cp4a_overview/) Cloud Pak for Applications
