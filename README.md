# Cloud Pak for Applications: Operational Modernization Solution

## Introduction
**Operational modernization** gives an operations team the opportunity to embrace modern operations best practices without putting change requirements on the development team. Modernizing from WebSphere Network Deployment (ND) to the **traditional WebSphere Application Server Base V9 runtime** in a container allows the application to be moved to the cloud without code changes.

The scaling, routing, clustering, high availability and continuous availability functionality that WebSphere ND was required for previously can be provided by the container runtime and allows the operations team to run cloud-native and older applications in the same environment with the same standardized logging, monitoring and security frameworks.

While traditional WebSphere isn't a 'built for the cloud' runtime like WebSphere Liberty, it can still be run in container and will receive the benefits of the consistency and reliability of containers as well as helping to improve DevOps and speed to market.

**This type of modernization shouldn't require any code changes** and can be driven by the operations team. **This path gets the application in to a container with the least amount of effort but doesn't modernize the application or the runtime.**

As organizations modernize to cloud platforms, new technologies and methodologies will be used for build, deployment and management of applications. While this modernization will be focused on cloud-native (built for the cloud) applications, using the traditional WebSphere container will allow common technologies and methodologies to be used regardless of the runtime.

  The diagram below shows the high level decision flow where IBM Cloud Transformation Advisor is used to analyze existing assets and a decision is made to not make code changes to the application and use the traditional WebSphere container as the target runtime.

  ![Liberty flow](images/tWASflow.jpg)

This repository holds a solution that is the result of a **operational modernization** for an existing WebSphere Java EE application that was moved from WebSphere ND v8.5.5 to the traditional WebSphere Base v9 container and is deployed by the IBM CloudPak for Applications to RedHat OpenShift.

## Table of Contents

- [Application Overview](#application-overview)
- [How the Application was Modernized](#how-the-application-was-modernized)
  - [Analysis](#analysis)
  - [Build](#build)
  - [Deploy](#deploy)
- [Deploy the Application](#deploy-the-application)
  - [Getting the project repository](#getting-the-project-repository)
  - [Create the Security Context Constraint](#create-the-security-context-constraint)
  - [Create the projects](#create-the-projects)
  - [Create a service account](#create-a-service-account)
  - [Deploy Jenkins](#deploy-jenkins)
  - [Update the Jenkins service account](update-the-jenkins-service-account)
  - [Import the deployment templates](#import-the-deployment-templates)
  - [Create the deployment definitions](#create-the-deployment-definitions)
  - [Import the build templates](#import-the-build-templates)
  - [Create the build definitions](#create-the-build-definitions)
  - [Run the pipeline](#run-the-pipeline)
- [Validate the Application](#validate-the-application)
- [Summary](#summary)

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
In order to modernize the application from WebSphere ND v8.5.5 to the WebSphere Base v9 container running on OpenShift, the application went through **analysis**, **build** and **deploy** phases.

### Analysis
[IBM Cloud Transformation Advisor](https://www.ibm.com/cloud/garage/practices/learn/ibm-transformation-advisor) was used to analyze the existing Customer Order Services application and the WebSphere ND runtime. The steps were:

1. Install IBM Cloud Transformation Advisor either in to a [Kubernetes Cluster](https://developer.ibm.com/recipes/tutorials/deploying-transformation-advisor-into-ibm-cloud-private/) or [locally](https://www.ibm.com/cloud/garage/tutorials/install-ibm-transformation-advisor-local)

2. Download and execute the **Data Collector** against the existing WebSphere ND runtime

3. Upload the results of the data collection in to IBM Cloud Transformation Advisor and review the analysis. A screenshot of the analysis is shown below:

  ![tWAS](images/tWAS-analyze/analysis2.jpg)

  In the case of the **CustomerOrderServicesApp.ear** application, IBM Cloud Transformation Advisor has determined that the migration to WebSphere Traditional on Private Cloud is of **Moderate** complexity and that there are four **Severe Issues** that have been detected.

4. Drilling down in to **Detailed Migration Analysis Report** that is part of the application analysis, it is apparent that IBM Cloud Transformation Advisor has detected that there are issues with JPA, specifically that the second-level cache and the JPA configuration properties must be migrated and with JAX-RS (missing Apache and Wink packages). These issues are related to a decision that was taken by IBM to allow WebSphere Application Server V9 to run in either JPA 2.0 or JPA 2.1 mode [as described here](https://www.ibm.com/support/knowledgecenter/SSEQTP_9.0.0/com.ibm.websphere.base.doc/ae/cejb_jpa21_behavior.html) and in either JAX-RS 2.0 or JAX-RS 1.1 mode [as described here](https://www.ibm.com/support/knowledgecenter/en/SS7K4U_9.0.0/com.ibm.websphere.zseries.doc/ae/rwbs_jaxrs_coexist.html). In order to run in JPA 2.1 mode and JAX-RS 2.0 mode, the changes highlighted by IBM Cloud Transformation Advisor must be made to the application. **However, this application can run in JPA 2.0 mode and JAX-RS 1.1 mode with no changes**.

  ![tWAS](images/tWAS-analyze/issues1.jpg)

5. In summary, no code changes are required to move this application to the traditional WebSphere Base v9 runtime and the decision was taken to proceed with the operational modernization.

Detailed, step-by-step instructions on how to replicate these steps are provided [here](tWAS-analyze.md)

### Build
The **build** phase created the traditional WebSphere container configuration artifacts. The steps were:

1. Update the existing `wsadmin` scripts that currently configure the runtime environment to configure the JPA 2.0 and JAXRS 1.1 engines. The final versions of the file can be found here:

- [cosConfig.py](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/tWAS/cosConfig.py)

2. The `Dockerfile` required to build the **immutable Docker Image** containing the application and traditional WebSphere was created. The final file can be found here:

- [Dockerfile](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Dockerfile)

3. The containerized application was tested locally before the code and configuration files were committed to the **git** repository

Detailed, step-by-step instructions on how to replicate these steps are provided [here](tWAS-build.md)

### Deploy
The **deploy** phase created the Jenkins, Kubernetes and RedHat OpenShift artifacts required to automate the build and deployment pipeline for the application. For illustration purposes, the application was deployed to three different RedHat OpenShift projects to simulate `development`, `staging` and `production`. The diagram below shows the flow through the pipeline. A more detailed description can be found [here]((tWAS-deploy.md))

  ![Pipeline](images/tWAS-deploy/overview.jpg)

The steps were:

1. Configure the RedHat OpenShift Cluster for WebSphere by creating the necessary `SecurityContextConstraints` definition. The file can be found here:

- [scc.yaml](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/ssc.yaml)

2. Create the RedHat OpenShift **build template** that would be used to define the RedHat OpenShift artifacts related to the build process including `ImageStream` and `BuildConfig` definitions. The file can be found here:

- [template-twas-build.yaml](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/template-twas-build.yaml)

3. Create the RedHat OpenShift **deployment template** that would be used to define the RedHat OpenShift artifacts related to the Customer Order Services application including `DeploymentConfig`, `Service` and `Route` definitions. The file can be found here:

- [template-twas-deploy.yaml](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/template-twas-deploy.yaml)

4. Create the Jenkins `Jenkinsfile` for the pipeline. The Jenkinsfile defines the steps that the pipeline takes to build the Customer Order Services application EAR file, create an immutable Docker Image and then move the image through the `dev`, `stage` and `prod` environments. The file can be found here:

- [Jenkinsfile](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Jenkinsfile)

5. Create the `build` project, load the **build template** and configure **Jenkins**

6. Create the `dev`, `stage` and `prod` projects and load the **deployment template**

7. Verify the pipeline.

Detailed, step-by-step instructions on how to replicate these steps are provided [here](tWAS-deploy.md)

## Deploy the Application
The following steps will deploy the modernized Customer Order Services application in a traditional WebSphere container to a RedHat OpenShift cluster.

### Prerequisites
You will need the following:

- [Git CLI](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- RedHat OpenShift 3.11 with Cluster Admin permissions
- [oc CLI](https://docs.openshift.com/container-platform/3.11/cli_reference/get_started_cli.html)
- DB2 Database

### Getting the project repository
You can clone the repository from its main GitHub repository page and checkout the appropriate branch for this version of the application.

```
git clone https://github.com/ibm-cloud-architecture/cloudpak-for-applications.git
cd cloudpak-for-applications
git checkout was90
```

### Create application database infrastructure
As said in the prerequisites section above, the Customer Order Services application uses uses DB2 as its database. Follow these steps to create the appropriate database, tables and data the application needs to:

1. Copy the createOrderDB.sql and initialDataSet.sql files you can find in the Common directory of this repository over to the db2 host machine (or git clone the repository) in order to execute them later.

2. Ssh into the db2 host

3. Change to the db2 instance user: `su {database_instance_name}``

4. Start db2: `db2start`

4. Create the ORDERDB database: `db2 create database ORDERDB`

5. Connect to the ORDERDB database: `db2 connect to ORDERDB`

6. Execute the createOrderDB.sql script you copied over in step 1 in order to create the appropriate tables, relationships, primary keys, etc: `db2 -tf createOrderDB.sql`

7. Execute the initialDataSet.sql script you copied over in step 1 to populate the ORDERDB database with the needed initial data set: `db2 -tf initialDataSet.sql`

If you want to re-run the scripts, please make sure you drop the databases and create them again.

### Create the Security Context Constraint
In order to deploy and run the WebSphere Base Docker image in an OpenShift cluster, we first need to configure certain security aspects for the cluster. The `Security Context Constraint` provided [here](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/ssc.yaml) grants the [service account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) that the WebSphere Base Docker container is running under the required privileges to function correctly.

A **cluster administrator** can use the file provided [here](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/ssc.yaml) with the following command to create the Security Context Constraint (SCC):

```
cd Deployment/OpenShift
oc apply -f ssc.yaml
```

### Create the projects
Four RedHat OpenShift projects are required in this scenario:
- Build: this project will contain the Jenkins server and the artifacts used to build the application image  
- Dev: this is the `development` environment for this application
- Stage: this is the `staging` environment for this application
- Prod: this is the `production` environment for this application

The file provided [here](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/twas-projects.yaml) contains the definitions for the four projects in a single file to make creation easier

Issue the command shown below to create the projects
```
oc create -f liberty-projects.yaml
```

### Create a service account
It is a good Kubernetes practice to create a [service account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for your applications. A service account provides an identity for processes that run in a Pod. In this step we will create a new service account with the name `websphere` in each of the `dev`, `stage` and `prod` projects and add the Security Context Constraint created above to them.

Issue the commands shown below to create the `websphere` service account and bind the ibm-websphere-scc to it in each of the projects:

```
oc create serviceaccount websphere -n cos-twas-dev
oc create serviceaccount websphere -n cos-twas-stage
oc create serviceaccount websphere -n cos-twas-prod
oc adm policy add-scc-to-user ibm-websphere-scc -z websphere -n cos-twas-dev
oc adm policy add-scc-to-user ibm-websphere-scc -z websphere -n cos-twas-stage
oc adm policy add-scc-to-user ibm-websphere-scc -z websphere -n cos-twas-prod
```

### Deploy Jenkins
Some RedHat OpenShift clusters are configured to automatically provision a Jenkins instance in a build project. The steps below can be used if your cluster is not configured for automatic Jenkins provisioning:

```
oc project cos-liberty-build
oc new-app jenkins-persistent
```

## Update the Jenkins service account
During provisioning of the Jenkins master a service account with the name `jenkins` is created. This service account has privileges to create new artifacts only in the project that it is running in. In this scenario Jenkins will need to create artifacts in the `dev`, `stage` and `prod` projects.

Issue the commands below to allow the `jenkins` service account to `edit` artifacts in the `dev`, `stage` and `prod` projects.

```
oc policy add-role-to-user edit system:serviceaccount:cos-twas-build:jenkins -n cos-twas-dev
oc policy add-role-to-user edit system:serviceaccount:cos-twas-build:jenkins -n cos-twas-stage
oc policy add-role-to-user edit system:serviceaccount:cos-twas-build:jenkins -n cos-twas-prod
```

### Import the deployment templates
RedHat OpenShift [templates](https://docs.openshift.com/container-platform/3.11/dev_guide/templates.html) are used to make artifact creation easier and repeatable. The template definition provided [here](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/liberty/Deployment/OpenShift/template-liberty-deploy.yaml) defines a Kubernetes [`Service`](https://kubernetes.io/docs/concepts/services-networking/service/), [`Route`](https://docs.openshift.com/container-platform/3.11/architecture/networking/routes.html) and [`DeploymentConfig`](https://docs.openshift.com/container-platform/3.11/architecture/core_concepts/deployments.html#deployments-and-deployment-configurations) for the CustomerOrderServices application.

The `gse-twas-deploy` template defines the following:
- `service` listening on ports `9080`, `9443` and `9082`
- `route` to expose the `9443` port externally
- `DeploymentConfig` to host the WebSphere Base container.
  - The `image` for the container is taken from the [`ImageStream`](https://docs.openshift.com/container-platform/3.11/dev_guide/managing_images.html) that will be populated by the Jenkins pipeline.
  - `environment variables` are defined for the DB2 database used by the application allowing for environment specific information to be injected
  - [Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/) for `liveness` and `readiness` are defined to check port 9443 is active
  - The `securityContext` is set to allow read/write access to the filesystem and to run the container as `user 1001`
  - The deployment will be updated if a new image is loaded to the `ImageStream` or if a change to the configuration is detected.

Issue the commands below to load the template named `gse-twas-deploy` in the `dev`, `stage` and `prod` projects.

```
oc create -f template-twas-deploy.yaml -n cos-twas-dev
oc create -f template-twas-deploy.yaml -n cos-twas-stage
oc create -f template-twas-deploy.yaml -n cos-twas-prod
```

### Create the deployment definitions
In this step the `gse-twas-deploy` template will be used to create a RedHat OpenShift [application](https://docs.openshift.com/container-platform/3.11/dev_guide/application_lifecycle/new_app.html) named `cos-twas` in the `dev`, `stage` and `prod` namespaces.

The result will be:
- `service` listening on ports `9080`, `9443` and `9082`
- `route` to expose the `9443` port externally
- `DeploymentConfig` to host the WebSphere Base container. The deployment config will wait for a `docker image` to be loaded in to the `ImageStream` by the Jenkins pipeline.

Issue the following commands to create the applications from the template:

```
oc new-app gse-twas-deploy -p APPLICATION_NAME=cos-twas -n cos-twas-dev
oc new-app gse-twas-deploy -p APPLICATION_NAME=cos-twas -n cos-twas-stage
oc new-app gse-twas-deploy -p APPLICATION_NAME=cos-twas -n cos-twas-prod
```

### Import the build templates
In this step a template for the `build` process will be loaded in to the `build` project. The template provided [here](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/blob/was90/Deployment/OpenShift/template-twas-build.yaml) defines the following artifacts:

- An [ImageStream](https://docs.openshift.com/container-platform/3.11/dev_guide/managing_images.html) for the application image. This will be populated by the Jenkins Pipeline
- An ImageStream for WebSphere Base which will pull down the latest version of the `ibmcom/websphere-traditional:latest-ubi` image and will monitor DockerHub for any updates.
- A `binary` [BuildConfig](https://docs.openshift.com/container-platform/3.11/dev_guide/builds/build_strategies.html) that will be used by the Jenkins Pipeline to build the application Docker image
- A `jenkinsfile` BuildConfig that defines the `Pipeline` using the `Jenkinsfile` in GitHub
- Parameters to allow the WebSphere Base image and GitHub repository to be provided when the template is instantiated

Issue the commands below to load the template named `gse-twas-build` in the `build` projects.

```
oc create -f template-twas-build.yaml -n cos-twas-build
```

### Create the build definitions
In this step the `gse-twas-build` template will be used to create a RedHat OpenShift [application](https://docs.openshift.com/container-platform/3.11/dev_guide/application_lifecycle/new_app.html) named `cos-twas` in the `build` namespaces.

The result will be:
- An [ImageStream](https://docs.openshift.com/container-platform/3.11/dev_guide/managing_images.html) for the application image. This will be populated by the Jenkins Pipeline
- An ImageStream for WebSphere Base which will pull down the latest version of the `ibmcom/websphere-traditional:latest-ubi` image and will monitor DockerHub for any updates.
- A `binary` [BuildConfig](https://docs.openshift.com/container-platform/3.11/dev_guide/builds/build_strategies.html) that will be used by the Jenkins Pipeline to build the application Docker image
- A `jenkinsfile` BuildConfig that defines the `Pipeline` using the `Jenkinsfile` in GitHub (with the URL provided as a parameter when the application is created)

Issue the following commands to create the application from the template:

```
oc new-app gse-twas-build -p APPLICATION_NAME=cos-twas -p SOURCE_URL="https://github.com/ibm-cloud-architecture/cloudpak-for-applications" -n cos-twas-build
```

### Run the pipeline  
The newly created pipeline can be started from the RedHat OpenShift console which allows access to the Jenkins logs but also tracks the progress in the OCP console.

1. Navigate to **Application Console --> Customer Order Services on twas - Build --> Builds --> Pipelines** and click the **Start Pipeline** button

  ![Run Pipeline](images/tWAS-deploy/run-pipeline.jpg)

2. When the pipeline starts, click the `view log` link to go to the Jenkins administration console. Note that it may take a couple of minutes before the `view log` link appears on the first pipeline build

  ![View Log](images/tWAS-deploy/view-log.jpg)

3. When prompted, log in with your OpenShift account and grant the required access permissions. The Jenkins console log will be displayed as shown below:

  ![Jenkins Log](images/tWAS-deploy/jenkins-log.jpg)

4. Return to the OpenShift Console and track the progress of the pipeline

  ![Running](images/tWAS-deploy/pipeline-running.jpg)

5. The pipeline will eventually stop at the **Promotion Gate** for approval to deploy to Production. Click the **Input Required** link as shown below

  ![Gate](images/tWAS-deploy/gate.jpg)

6. When the *Promote application to Production* question is displayed, click **Proceed**

  ![Promote](images/tWAS-deploy/promote.jpg)

7. Return to the OpenShift Console and validate that the pipeline is now complete

  ![Complete](images/tWAS-deploy/complete.jpg)

## Validate the Application
Now that the pipeline is complete, validate the Customer Order Services application is deployed and running in `dev`, `stage` and `prod`

Now that the pipeline is complete, validate the Customer Order Services application is deployed and running in `dev`, `stage` and `prod`

1. In the OpenShift Console, navigate to **Application Console --> Customer Order Services on twas - Dev --> Applications --> Deployments** and click on the link in the **Latest Version** column

  ![Deployment](images/tWAS-deploy/deployment.jpg)

2. Information about the deployment will be displayed including the **image** that is being used (note the **tag** on the image as it will be the same in the `stage` and `prod` deployments). After a few minutes the container will be marked as **ready**

  ![Pods](images/tWAS-deploy/pods.jpg)

3. Click **Applications --> Routes** and click on the **route** for the application. Note that the URL is < application_name >-< project_name >.< ocp cluster url >. In this case the project name is `cos-twas-dev`

  ![Route](images/tWAS-deploy/route.jpg)

4. Add `/CustomerOrderServicesWeb` to the end of the URL in the browser to access the application

  ![Dev Running](images/tWAS-deploy/dev-running.jpg)

5. Log in to the application with `username: rbarcia` and `password: bl0wfish`

6. Repeat the validations for the `stage` and `prod` Projects.

## Summary
This application has been modified from the initial [WebSphere ND v8.5.5 version](https://github.com/ibm-cloud-architecture/cloudpak-for-applications/tree/was855) to run on traditional WebSphere and deployed by the IBM CloudPak for Applications.
