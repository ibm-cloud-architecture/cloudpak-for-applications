# Liberty - Analyze

This section covers how to use [IBM Cloud Transformation Advisor](https://www.ibm.com/cloud/garage/practices/learn/ibm-transformation-advisor) to analyze an existing traditional WebSphere application. For this scenario the WebSphere Liberty runtime is chosen as the target runtime and the intention is to migrate this application with minimal code changes. WebSphere Liberty is a fast, dynamic, and easy-to-use Java application server, built on the open source Open Liberty project. Ideal or the cloud, Liberty is a combination of IBM technology and open source software, with fast startup times (<2 seconds), no server restarts to pick up changes, and a simple XML configuration.

## Summary
This section has the following steps:

1. Introduction to IBM Cloud Transformation Advisor

2. Install IBM Cloud Transformation Advisor

3. Download and run the Data Collector

4. Upload and analyze the results

5. Determine the migration/modernization path and next steps

### Introduction to IBM Cloud Transformation Advisor
IBM Cloud Transformation Advisor helps you access, analyze and modernize middleware based apps into IBM Cloud(s). It categorizes Java EE apps and MQ queue managers as simple, medium and complex based on migration complexity and provides guidance for modernization. IBM Cloud Transformation Advisor can accelerate the process to move your on-premises apps to cloud, minimize migration errors and risks, and reduce time to market in five steps.

You can use IBM Transformation Advisor for these activities:
- Identify the Java EE programming models in an app
- Determine the complexity of apps by reviewing a high-level inventory of the content and structure of each app
- Highlight the Java EE programming model and WebSphere API differences between the profile types
- Learn any Java EE specification implementation differences that might affect the app

The tool also provides suggestions for the right-fit IBM WebSphere Application Server edition and offers advice, practices, and potential solutions to move apps to WebSphere Liberty or to newer versions of WebSphere Application Server.


## Install IBM Cloud Transformation Advisor
IBM Cloud Transformation Advisor is split in to two components (the `analysis engine` and the `data collector`). You can choose to between installing the `analysis engine` in to an IBM Cloud Private Cluster or locally on a machine with Docker.

[Installing IBM Cloud Transformation Advisor in to your IBM Cloud Private Cluster](https://developer.ibm.com/recipes/tutorials/deploying-transformation-advisor-into-ibm-cloud-private/)

[Installing IBM Cloud Transformation Advisor Beta Edition locally](https://www.ibm.com/cloud/garage/tutorials/install-ibm-transformation-advisor-local)

### Download the Data Collector
Once IBM Cloud Transformation Advisor is installed, it is necessary to create a new Workspace and Collection and then download the **Data Collector** that will be used to examine the existing environment and applications.

1. Open IBM Cloud Transformation Advisor in a browser and click the button to create a new **Workspace**

  ![Home Page](images/liberty-analyze/workspace1.jpg)

2. Enter a Workspace name such as `CloudPak_for_Applications` and click **Next**

  ![Workspace](images/liberty-analyze/workspace2.jpg)

3. Enter a Collection name such as `WAS855_AppSrv01` and click **Let's go**

  ![Collection](images/liberty-analyze/workspace3.jpg)

4. When the **No recommendations available** page is displayed, click the **Data Collector** button

  ![Collector](images/tWAS-analyze/collector.jpg)

5. When the **Data Collector** page is displayed, select the **Source Operating System** for your environment and click the **Download** button to download the Data Collector.

  ![Download](images/liberty-analyze/download.jpg)

  This results in a file with a name similar to `transformationadvisor-Linux_CloudPak_for_Applications_WAS855_AppSrv01.tgz` being downloaded.


## Run the Data Collector
Upload the Data Collector zip file that was downloaded from IBM Cloud Transformation Advisor in the previous step to the machine that the WebSphere ND Deployment Manager or the Standalone WebSphere Application Server is installed. The directory used arbitrary.

1. Navigate to the directory you uploaded the `transformationadvisor-Linux_CloudPak_for_Applications_WAS855_AppSrv01.tgz` file to and issue the following commands to extract the Data Collector:

  ```bash
  mkdir datacollector
  cd datacollector
  mv transformationadvisor-Linux_CloudPak_for_Applications_WAS855_AppSrv01.tgz .
  tar -zxvf transformationadvisor-Linux_CloudPak_for_Applications_WAS855_AppSrv01.tgz
  cd transformationadvisor-*
  ```

2. It is necessary to modify the scan performed by the Data Collector to include the `org.pwte` package as the Data Collector doesn't scan `org.*` packages by default. Open the `conf/customCmd.properties` file and modify it as shown below:

  ```bash
  evaluation=--evaluate --excludePackages=com.ibm,com.informix,com.microsoft,com.sybase,com.sun,java,javax,net,oracle,sqlj,_ibmjsp --includePackages=org.pwte
  migration_liberty=--analyze --sourceAppServer=was855 --targetAppServer=liberty --targetCloud=dockerIBMCloud --includePackages=org.pwte --excludePackages=com.ibm,com.informix,com.microsoft,com.sybase,com.sun,java,javax,net,oracle,sqlj,_ibmjsp
  migration_was=--analyze --sourceAppServer=was855 --targetAppServer=was90 --targetCloud=vmIBMCloud --includePackages=org.pwte --excludePackages=com.ibm,com.informix,com.microsoft,com.sybase,com.sun,java,javax,net,oracle,sqlj,_ibmjsp
  #inventory=--inventory --excludeFiles=".*/directory/LargeXMLFileName.xml"
  #featureList=--featureList --excludeFiles=".*/directory/LargeXMLFileName.xml"
  #java_opt=-Xmx2g
  ```

2. The following command assumes that WebSphere Application Server v855 is installed to `/opt/IBM/WebSphere/AppServer855` with a **profile** named `AppSrv01` and that the **administration user** is `wasadmin` with a **password** of `wasadmin`. Modify and issue the following command as necessary to execute the Data Collector against the WebSphere environment:

  ```bash
  ./bin/transformationadvisor -w /opt/IBM/WebSphere/AppServer855 -p AppSrv01 wasadmin wasadmin
  ```

3. When prompted, accept the **license agreement**. The Data Collection process will now start and will analyze all of the applications installed in the WebSphere Application Server environment and will also collect the related Java EE artifacts such as Data Sources and JMS definitions.

4. When the analysis is complete, the Data Collector will attempt to upload the collection results to IBM Cloud Transformation Advisor. If this is successful, you can skip to the **Analyze the Recommendations** section. If not, you will receive an error at the end of Data Collection and will find a file named `AppSrv01.zip` in your current directory as shown below.

  ```bash
  ~/datacollector/transformationadvisor-1.9.6# ls -la *.zip
  -rw-r--r-- 1 root root 625493 Jun 12 12:58 AppSrv01.zip
  ```

  Download this **Data Collector Results zip** file ready for uploading to IBM Cloud Transformation Advisor in the next section

### Upload the Data Collector results
In this section the results from the Data Collector will be uploaded to IBM Cloud Transformation Advisor.

1. In the IBM Cloud Transformation Advisor web browser session, click the **Recomendations** link in the top left corner and then click the **Upload data** button as shown below

  ![Upload](images/liberty-analyze/upload1.jpg)

2. When the **Upload data** dialog is displayed, use the **Drop or Add File** button to select the **Data Collector Results zip** file that was downloaded in the previous section. Click **Upload**

  ![Upload2](images/liberty-analyze/upload2.jpg)

  After a few moments the upload of the data collector results will be completed.

## Analyze the Recommendations
Once the Data Collector Results have been uploaded to IBM Cloud Transformation Advisor a set of recommendations will be created and shown on the **Recommendations** page. In this section the recommendations will be analyzed and interpreted.

1. The default recommendations are based on a target runtime of **Liberty on Private Cloud**. The Data Collector analyzed all of the applications running on the traditional WebSphere profile a displays a row in the chart for each application.

  ![tWAS](images/liberty-analyze/analysis1a.jpg)

  In the case of the **CustomerOrderServicesApp.ear** application, IBM Cloud Transformation Advisor has determined that the migration to WebSphere Traditional on Private Cloud is of **Moderate** complexity and that there are two **Severe Issues** that have been detected. Click on the **CustomerOrderServicesApp.ear** application name to see more information.

3. Review the analysis results and scroll down to the **Technology Issues** section. Note that IBM Cloud Transformation Advisor has detected that there are issues with lookups for Enterprise JavaBeans and with accessing the Apache Wink APIs.

  ![tWAS](images/liberty-analyze/issues1a.jpg)

4. In order to review the IBM Cloud Transformation Advisor results in more detail, scroll to the bottom of the analysis page and click on the **Analysis Report** link

  ![Report](images/liberty-analyze/reports1.jpg)

5. When the warning dialog is displayed, click **OK**

  ![Warning](images/liberty-analyze/reports2.jpg)

6. The **Detailed Migration Analysis Report** will be displayed which show the results of the migration rules that were executed by the Data Collector and returned results. Scroll down to the **Severe Rules** section and click on the **Show rule help** link for each of the results. Review the recommendations.

  ![JPA](images/liberty-analyze/severe.jpg)

  **Behavior change on lookups for Enterprise JavaBeans** In Liberty, EJB components are not bound to a server root Java Naming and Directory Interface (JNDI) namespace as they are in WebSphere Application Server traditional. The fix for this is to change the three classes that use `ejblocal` to use the correct URL for Liberty

  **The user of system provided Apache Wink APIs requires configuration** To use system-provided third-party APIs in Liberty applications, you must configure the applications to include the APIs. In WebSphere Application Server traditional, these APIs are available without configuration. This is a configuration only change and can be achieved by using a `classloader` definition in the Liberty server.xml file.

### Final Analysis
The intention of this traditional WebSphere V855 --> Liberty (Private Cloud) scenario is to migrate the Customer Order Services application to the cloud-ready new runtime with minimal code changes.

IBM Cloud Transformation Advisor was used to analyze the application for compatibility with traditional WebSphere V9 (Private Cloud) and determined that only small changes to three classes would be required.

While this scenario will move the application to the cloud-ready WebSphere Liberty runtime in a container, it will not **modernize** the application architecture and code in any way. 

Now proceed to the [Liberty - Build](liberty-build.md) section where the process of making the code changes and configuring the Liberty runtime will be covered step-by-step
