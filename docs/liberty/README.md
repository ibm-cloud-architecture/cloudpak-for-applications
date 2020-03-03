# Application Modernization: WebSphere Runtime Modernization Solution

## Run it yourself
Detailed step-by-step instructions are available to deploy the solution in your environment:

- [Deploy the solution on OCP 4.3 using Tekton and ArgoCD](liberty-deploy-tekton-argocd.md)
- [Deploy the solution on OCP 4.3 using Tekton](liberty-deploy-tekton.md)
- [Deploy the solution on OCP 4.3 using Jenkins](liberty-deploy-43-jenkins.md)
- [Deploy the solution on OCP 3.11 using Jenkins](liberty-deploy-311-jenkins.md)

## Introduction
**Runtime modernization** moves an application to a 'built for the cloud' runtime with the least amount of effort. **WebSphere Liberty** is a fast, dynamic, and easy-to-use Java application server, built on the open source Open Liberty project. Ideal or the cloud, Liberty is a combination of IBM technology and open source software, with fast startup times (<2 seconds), no server restarts to pick up changes, and a simple XML configuration.

However, WebSphere Liberty doesn't support all of the legacy Java EE and WebSphere proprietary functionality and some code changes maybe required to move an existing application to the new runtime. Effort is also required to move the application configuration from traditional WebSphere to WebSphere Liberty's XML configuration files.

**This path gets the application on to a cloud-ready runtime container which is easy to use and portable. However, the application is mostly unchanged and has not been 'modernized' to a newer architecture such as micro-services**  

Applications deployed on the WebSphere Liberty container runtime can be build, deployed and managed with the same common technologies and methodologies that would be used by cloud-native (built for the cloud) applications.

  The diagram below shows the high level decision flow where IBM Cloud Transformation Advisor is used to analyze existing assets and a decision is made to move the monolithic application to the Liberty container.

  ![Liberty flow](images/libertyflow.jpg)

This repository holds a solution that is the result of a **runtime modernization** for an existing WebSphere Java EE application that was moved from WebSphere ND v8.5.5 to WebSphere Liberty and deployed by the IBM CloudPak for Applications to RedHat OpenShift.

## Application Overview
The **Customer Order Services** application is a simple store-front shopping application, built during the early days of the Web 2.0 movement. Users interact directly with a browser-based interface and manage their cart to submit orders.  This application is built using the traditional [3-Tier Architecture](http://www.tonymarston.net/php-mysql/3-tier-architecture.html) model, with an HTTP server, an application server, and a supporting database.

![Phase 0 Application Architecture](https://github.com/ibm-cloud-architecture/refarch-jee/raw/master/static/imgs/apparch-pc-phase0-customerorderservices.png)

There are several components of the overall application architecture:
- Starting with the database, the application leverages two SQL-based databases running on [IBM DB2](https://www.ibm.com/analytics/us/en/technology/db2/).

- The application exposes its data model through an [Enterprise JavaBean](https://en.wikipedia.org/wiki/Enterprise_JavaBeans) layer, named **CustomerOrderServices**.  This components leverages the [Java Persistence API](https://en.wikibooks.org/wiki/Java_Persistence/What_is_JPA%3F) to exposed the backend data model to calling services with minimal coding effort.
  - This build of the application uses JavaEE6 features for EJBs and JPA.
- The next tier of the application, named **CustomerOrderServicesWeb**, exposes the necessary business APIs via REST-based web services.  This component leverages the [JAX-RS](https://en.wikipedia.org/wiki/Java_API_for_RESTful_Web_Services) libraries for creating Java-based REST services with minimal coding effort.
  - This build of the application is using **JAX-RS 1.1** version of the respective capability.
- The application's user interface is exposed through the **CustomerOrderServicesWeb** component as well, in the form of a [Dojo Toolkit](#tbd)-based JavaScript application.  Delivering the user interface and business APIs in the same component is one major inhibitor our migration strategy will help to alleviate in the long-term.
- Finally, there is an additional integration testing component, named **CustomerOrderServicesTest** that is built to quickly validate an application's build and deployment to a given application server.  This test component contains both **JPA** and **JAX-RS**-based tests.

## How the Application was Modernized
In order to modernize the application from WebSphere ND v8.5.5 to WebSphere Liberty running on OpenShift, the application went through **analysis**, **build** and **deploy** phases.

### Analysis
[IBM Cloud Transformation Advisor](https://www.ibm.com/cloud/garage/practices/learn/ibm-transformation-advisor) was used to analyze the existing Customer Order Services application and the WebSphere ND runtime. The steps were:

- Install IBM Cloud Transformation Advisor either in to a [Kubernetes Cluster](https://developer.ibm.com/recipes/tutorials/deploying-transformation-advisor-into-ibm-cloud-private/) or [locally](https://www.ibm.com/cloud/garage/tutorials/install-ibm-transformation-advisor-local)

- Download and execute the **Data Collector** against the existing WebSphere ND runtime

- Upload the results of the data collection in to IBM Cloud Transformation Advisor and review the analysis. A screenshot of the analysis is shown below:
![tWAS](images/liberty-analyze/analysis1a.jpg)

- In the case of the **CustomerOrderServicesApp.ear** application, IBM Cloud Transformation Advisor has determined that the migration to WebSphere Liberty on Private Cloud is of **Moderate** complexity and that there are two **Severe Issues** that have been detected.

- Drilling down in to **Detailed Migration Analysis Report** that is part of the application analysis, it is apparent that IBM Cloud Transformation Advisor has detected that there are issues with lookups for Enterprise JavaBeans and with accessing the Apache Wink APIs.
![JPA](images/liberty-analyze/severe.jpg)

- **Behavior change on lookups for Enterprise JavaBeans** In Liberty, EJB components are not bound to a server root Java Naming and Directory Interface (JNDI) namespace as they are in WebSphere Application Server traditional. The fix for this is to change the three classes that use `ejblocal` to use the correct URL for Liberty

- **The user of system provided Apache Wink APIs requires configuration** To use system-provided third-party APIs in Liberty applications, you must configure the applications to include the APIs. In WebSphere Application Server traditional, these APIs are available without configuration. This is a configuration only change and can be achieved by using a `classloader` definition in the Liberty server.xml file.

- In summary, some minimal code changes are required to move this application to the WebSphere Liberty runtime and the decision was taken to proceed with these code changes.

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-analyze.md)

### Build
The **build** phase made changes to source code and created the WebSphere Liberty configuration artifacts. The steps were:

- Make the simple code changes required for the EJB lookups which were recommended by IBM Cloud Transformation Advisor. The three Java classes that should be modified to look up Enterprise JavaBeans differently are shown in the detailed analysis view of IBM Cloud Transformation Advisor:
![Analysis](images/liberty-build/analysis.jpg)

- Below is an example of the code changes required for one of the three Java classes. The `org.pwte.example.resources.CategoryResource.java` is changed from using `ejblocal` on line 28 as shown below:

Before:

```java
...
InitialContext().lookup("ejblocal:org.pwte.example.service.ProductSearchService");
...
```

After:

```java
...
InitialContext().lookup("java:app/CustomerOrderServices/ProductSearchServiceImpl!org.pwte.example.service.ProductSearchService");
...
```

- The WebSphere Liberty runtime configuration files `server.xml`, `server.env` and `jvm.options` were created from the templates provided by IBM Cloud Transformation Advisor. The final versions of files can be found here:

    - [server.xml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/liberty/server.xml)
    - [server.env](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/liberty/server.env)
    - [jvm.options](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/liberty/jvm.options)

- WebSphere Liberty was configured for application monitoring using Prometheus and the Prometheus JMX Exporter. This was necessary to integrate WebSphere Liberty with the RedHat OpenShift monitoring framework.

- The `Dockerfile` required to build the **immutable Docker Image** containing the application and WebSphere Liberty was created from the template provided by IBM Cloud Transformation Advisor. The final file for use with Jenkins can be found here:

    - [Dockerfile](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Dockerfile)

- The final `Dockerfile` file for use with Tetkon/OpenShift Pipelines can be found here:

    - [Dockerfile](https://github.com/ibm-cloud-architecture/appmod-liberty-tekton/blob/master/Dockerfile)

- The containerized application was tested locally before the code and configuration files were committed to the **git** repository

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-build.md)

### Deploy using Tekton and ArgoCD
The following steps will deploy the modernized Customer Order Services application in a WebSphere Liberty container to a Red Hat OpenShift cluster using **OpenShift Pipelines** and **ArgoCD**.

The diagram below shows the following flow:

- 1) A developer commits code to the `application repository`

- 2) A webhook starts a `tekton pipeline` running in the `build` project

- 3) A `tekton task` clones the application source code (4) from the application repository, uses `Maven` to compile and test the application before using `buildah` to create a `Docker image` which is pushed to the docker registry (5)

- 6) A `tekton task` deploys the `application` to the local namespace using the image from the `docker registry` (7)

- 8) A `tekton task` updates the `gitops repository` with the `docker image tag` for the newly created docker image and commits the change (9)

- 10) ArgoCD is used to `synchronize` the changes from the gitops repository with the `dev` namespace

- 11) The application running in the `dev` namespace is updated with the latest docker image from the registry

  ![Pipeline](images/argo-flow.jpg)

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-deploy-tekton-argocd.md)

### Deploy using Tekton
The following steps will deploy the modernized Customer Order Services application in a WebSphere Liberty container to a Red Hat OpenShift cluster using **OpenShift Pipelines**.

The diagram below shows the following flow:

- 1) A developer commits code to the `application repository`

- 2) A webhook starts a `tekton pipeline` running in the `build` project

- 3) A `tekton task` clones the application source code (4) from the application repository, uses `Maven` to compile and test the application before using `buildah` to create a `Docker image` which is pushed to the docker registry (5)

- 6) A `tekton task` deploys the `application` to the local namespace using the image from the `docker registry` (7)

  ![Pipeline](images/tekton-flow.jpg)

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-deploy-tekton.md)

### Deploy using Jenkins on OCP 4.3
The **deploy** phase created the Jenkins, Kubernetes and RedHat OpenShift artifacts required to automate the build and deployment pipeline for the application. For illustration purposes, the application was deployed to three different RedHat OpenShift projects to simulate `development`, `staging` and `production`. The diagram below shows the flow through the pipeline. A more detailed description can be found [here](liberty-deploy-43-jenkins.md)

  ![Pipeline](images/liberty-deploy/overview.jpg)

The steps were:

- Configure the RedHat OpenShift Cluster for WebSphere by creating the necessary `SecurityContextConstraints` definition. The file can be found here:

    - [scc.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/ssc.yaml)

- Create the RedHat OpenShift **build template** that would be used to define the RedHat OpenShift artifacts related to the build process including `ImageStream` and `BuildConfig` definitions. The file can be found here:

    - [template-libery-build.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/template-liberty-build.yaml)

- Create the RedHat OpenShift **deployment template** that would be used to define the RedHat OpenShift artifacts related to the Customer Order Services application including `DeploymentConfig`, `Service` and `Route` definitions. The file can be found here:

    - [template-libery-deploy.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/template-liberty-deploy.yaml)

- Create the Jenkins `Jenkinsfile` for the pipeline. The Jenkinsfile defines the steps that the pipeline takes to build the Customer Order Services application EAR file, create an immutable Docker Image and then move the image through the `dev`, `stage` and `prod` environments. The file can be found here:

    - [Jenkinsfile](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Jenkinsfile)

- Create the `build` project, load the **build template** and configure **Jenkins**

- Create the `dev`, `stage` and `prod` projects and load the **deployment template**

- Verify the pipeline.

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-deploy-43-jenkins.md)

### Deploy using Jenkins on OCP 3.11
The **deploy** phase created the Jenkins, Kubernetes and RedHat OpenShift artifacts required to automate the build and deployment pipeline for the application. For illustration purposes, the application was deployed to three different RedHat OpenShift projects to simulate `development`, `staging` and `production`. The diagram below shows the flow through the pipeline. A more detailed description can be found [here](liberty-deploy-311-jenkins.md)

  ![Pipeline](images/liberty-deploy/overview.jpg)

The steps were:

- Configure the RedHat OpenShift Cluster for WebSphere by creating the necessary `SecurityContextConstraints` definition. The file can be found here:

    - [scc.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/ssc.yaml)

- Create the RedHat OpenShift **build template** that would be used to define the RedHat OpenShift artifacts related to the build process including `ImageStream` and `BuildConfig` definitions. The file can be found here:

    - [template-libery-build.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/template-liberty-build.yaml)

- Create the RedHat OpenShift **deployment template** that would be used to define the RedHat OpenShift artifacts related to the Customer Order Services application including `DeploymentConfig`, `Service` and `Route` definitions. The file can be found here:

- [template-libery-deploy.yaml](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Deployment/OpenShift/template-liberty-deploy.yaml)

- Create the Jenkins `Jenkinsfile` for the pipeline. The Jenkinsfile defines the steps that the pipeline takes to build the Customer Order Services application EAR file, create an immutable Docker Image and then move the image through the `dev`, `stage` and `prod` environments. The file can be found here:

    - [Jenkinsfile](https://github.com/ibm-cloud-architecture/appmod-liberty-jenkins/blob/master/Jenkinsfile)

- Create the `build` project, load the **build template** and configure **Jenkins**

- Create the `dev`, `stage` and `prod` projects and load the **deployment template**

- Verify the pipeline.

Detailed, step-by-step instructions on how to replicate these steps are provided [here](liberty-deploy-311-jenkins.md)

## Summary
This application has been modified from the initial [WebSphere ND v8.5.5 version](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/tree/was855) to run on WebSphere Liberty and deployed by the IBM CloudPak for Applications.
