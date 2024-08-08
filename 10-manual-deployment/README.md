# Manually deploying an application to Azure


The goal of this session will be to **migrate an application** to Azure, understanding basic **identity concepts** and **resource organization**. We will also introduce the most important services, including **Storage Accounts**, **Virtual Networks**, **App Services**, **Azure Vault** and **Azure Database for Postgresql** Flexible Server.

## The [Real World](https://github.com/gothinkster/realworld) project

![Blueprint of an artifact and its implementation, by Dall-e](images/blueprint-of-an-artifact-and-its-implementation.jpg)

The purpose of GitHub's real-world project initiative is to provide developers with **practical learning experiences** through actual project implementations. These projects aim to bridge the gap between theoretical knowledge and real-world application development by offering complete, functional codebases that demonstrate how various technologies, frameworks, and best practices are used in production-ready applications.

GitHub's RealWorld project **has approximately 100 implementations** available. The most popular technologies used in GitHub's RealWorld project implementations include a diverse range of programming languages and frameworks. Notable mentions are JavaScript frameworks like React, Vue.js, and Angular; Python; Ruby; Go; PHP; Elixir with the Phoenix framework; Java; and C# for .NET technologies. Additionally, mobile development frameworks such as Flutter and Xamarin.Forms are included, along with database technologies like PostgreSQL. This variety reflects the broad spectrum of options available to developers for creating production-ready applications.

::: Notes

The image tries to make an anology: it is fine to learn by listenting to a talk (blueprint) but it is even better
if we can put it into practice (implementation).

:::

### Requisites

#### NodeJS support

Node will be require for test execution.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] \
  && printf %s "${HOME}/.nvm" \
  || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
nvm install --lts

node --version
```

#### .Net 8 for Linux

The backend application consists in a C# implemantion of the API. We will need
to build and execute it.

```bash
sudo apt-get update \
  && sudo apt-get install -y dotnet-sdk-8.0
dotnet --version
```

### The application

#### Source code download

Only the backend application will be used during this training.

```bash
git clone https://github.com/Erikvdv/realworldapiminimal
```

#### Local building

The application will generate several `.dll` files.

```bash
cd src/Api/
dotnet dotnet publish --configuration Release
```

#### Running locally

The API will (by default) start at port 5000.

```bash
cd bin/Release/net8.0/publish
dotnet Api.dll
```

#### Testing

A [Postman collection](https://www.postman.com/collection/) is a set of HTTP-based
tests that can be executed by several tools, incluidng [Newman](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/) (wrapped in a bash script).

```bash
wget https://github.com/gothinkster/realworld/blob/main/api/Conduit.postman_collection.json
wget https://github.com/gothinkster/realworld/blob/main/api/run-api-tests.sh
chmod +x ./run-api-tests.sh

APIURL=http://localhost:5000/ ./run-api-tests.sh
```

#### Packaging

To make it simple, we will start by zipping the whole application:

```bash
sudo apt install zip -y

zip -r /tmp/app.zip .
```

## Azure

![Blueprint of a neightborhood, by Dall-E](images/blueprint-of-a-neightborhood.jpg)

### The [Azure Portal](https://portal.azure.com)

![Azure portal screenshoot](images/azure-portal.png)

The Azure portal is a **web-based**, unified management console that allows users to create, manage, and monitor a wide range of Azure services and resources. It provides a **graphical user interface** for managing Azure subscriptions, enabling users to perform tasks such as setting up databases, scaling virtual machines, and tracking costs. Additionally, it features customizable dashboards and guided wizards to streamline resource management and enhance user experience.

### The API

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az version
az login --use-device-code


az account show
```

### Physical global infrastructure


#### [Regions](https://datacenters.microsoft.com/globe/explore/) 

![Picture of an AZ](images/datacenter.png)

An Azure region is a geographic area that contains a **set of data centers** connected through a dedicated low-latency network. These regions allow organizations to deploy their applications and services **closer to their users**, optimizing performance and ensuring **compliance with data residency** requirements. Cost varies between different regions, as the list of available services does.

Each region can consist of one or more data centers, and Azure currently operates over **60 regions worldwide**.

```bash
az account list-locations --output table \
  | grep "(Europe)"
```

#### [Availability Zones](https://news.microsoft.com/stories/microsoft-datacenter-tour/)

An availability zone in cloud computing is a distinct location within a region that is **designed to be isolated from failures** in other availability zones. Each availability zone has its own independent power, cooling, and networking infrastructure to ensure high availability and fault tolerance. They are geographically separated to mitigate the risk of local disasters affecting multiple zones simultaneously, yet close enough to provide low-latency network connectivity for data replication and resource distribution. This setup allows cloud providers to offer resilient and reliable services by distributing applications and data across multiple availability zones within a region.

```bash
az vm list-skus \
  --location westeurope \
  --all true \
  --resource-type virtualMachines \
  --output table
```

### Logical organization

#### Accounts

An Azure Account is the first identity created when an organization
joins Azure, using an email address as the subject identifier. The
account is associated to a Tenant.

#### Tenants

An Azure tenant is a dedicated and trusted instance of Microsoft Entra ID (formerly Azure Active Directory) that represents an organization in the Microsoft cloud and
it is associated to an account.

* An Azure tenant is essentially a **single instance** of Entra ID that is automatically created when an organization signs up for a Microsoft cloud.
* Each tenant **represents a single organization** and acts as a security boundary, containing all the users, groups, and applications for that organization.
* Every Azure tenant has a globally **unique name and ID**. The tenant name typically ends with "onmicrosoft.com" (e.g., organizationname.onmicrosoft.com).
* The tenant is **responsible for authenticating and authorizing** Azure accounts within the organization. It provides identity and access management services for cloud-based applications. Tenants offer a centralized location for managing user identities, permissions, and access to Azure services across the organization.
* Organizations can have **multiple tenants if needed**, though typically one tenant is sufficient for most organizations.

#### Management groups

An Azure management group is a top-level **organizational container** in Azure that helps manage access, policies, and compliance across multiple Azure subscriptions. It allows for **hierarchical organization**, enabling enterprises to apply governance conditions such as policies and role-based access control (RBAC) at a higher level, which then cascade down to all associated subscriptions and resources.

Each Azure Active Directory (Entra ID) tenant has a root management group that encompasses all other management groups and subscriptions, providing a unified structure for efficient and scalable management of Azure resources.

#### Subscriptions

An Azure subscription is a **logical container** that organizes and manages Azure resources, serving as a **billing and administrative boundary** for cloud services.

It defines how usage is billed and enabling role-based access control (RBAC) for resource management.

It is common to define a different subscription for **each application**, or even for **each application environment**.

Each subscription is associated with an Azure tenant and can be categorized into various types, such as Pay-as-you-go or Enterprise Agreement, to suit different organizational needs.

#### Resource groups

An Azure resource group is a logical container within a subscription that **holds related Azure resources** such as virtual machines, databases, and storage accounts, allowing for easier management and organization. 

It enables users to collectively deploy, monitor, and manage resources that **share the same lifecycle**, such as by project, environment, or department. Resource groups facilitate consistent policy application, access control through role-based access control (RBAC), and **streamlined billing and cost management** by aggregating costs for all resources within the group. Additionally, resources within a resource group can be located in different regions, providing flexibility in resource deployment and management.

Multiple resource groups may be used for different environments, but they are more commonly used for segregating different parts of a complex system.

The region of the resource group is where its metadata is kept, but resources belonging to it can be deployed in any other region.

```bash
az group create \
  --name $USER-rg \
  --location westeurope
```

## Storage

![A blueprint of a library](images/blueprint-of-a-library.jpg)

### Storage accounts

An Azure Storage Account is a fundamental component of Microsoft's cloud storage solution, providing a platform for storing various types of data. It acts as a container that groups together different Azure storage services, such as **Blob Storage** for unstructured data, **File Storage** for managed file shares, **Queue Storage** for message storage, and **Table Storage** for structured data.

Each storage account has a unique namespace accessible globally via HTTP or **HTTPS**, ensuring that data is highly available and protected through redundancy options.

```bash
az storage account create \
  --name ${USER}repositorysa \
  --resource-group $USER-rg \
  --sku Standard_LRS \
  --encryption-services blob
```

### Blob storage

Azure Blob Storage is an **object storage** service designed for storing large amounts of unstructured data, such as text and binary files. It supports three types of **blobs—block** blobs for documents and media, **append blobs** for logging, and **page blobs** for virtual machine disks.

```bash
az storage container create \
  --account-name ${USER}repositorysa \
  --name appversions \
  --auth-mode login
```

### Transferring files

We will upload the zip artifact to the recentely created blob container.
**Explicit permission must be granted** to manipulate the container, even if
it has been created by the same user. That is why uploading a file to it
**will fail**:

```bash
az storage blob upload \
  --account-name ${USER}repositorysa \
  --container-name appversions \
  --name app.zip \
  --file /tmp/app.zip \
  --auth-mode login
```

Before trying it again, a role with proper permissions must be assigned
to the current Azure user to provide access to the specific blob container.

```bash
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo $SUBSCRIPTION_ID

USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)
echo $USER_PRINCIPAL_ID

az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $USER_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$USER-rg/providers/Microsoft.Storage/storageAccounts/${USER}repositorysa"
```

**Wait a few seconds**, as the role assignment requires broad propagation. Now try to
upload the file again.

```bash
az storage blob upload \
  --account-name ${USER}repositorysa \
  --container-name appversions \
  --name app.zip \
  --file /tmp/app.zip \
  --auth-mode login
```

Use the `list` command to ensure that the file has been correctly put in the blob container.

```bash
az storage blob list \
  --account-name ${USER}repositorysa \
  --container-name appversions \
  --output table \
  --auth-mode login
```

## Databases

![Blueprint of an archive](images/blueprint-archive.jpg)

Azure provides several managed database options, including Azure SQL Database for SQL Server-based applications, Azure SQL Managed Instance for existing SQL Server workloads, and Azure Database for PostgreSQL, MySQL, and MariaDB for open-source databases. Azure Cosmos DB supports globally distributed, multi-model databases, while Azure Managed Instance for Apache Cassandra offers a managed service for Cassandra. For analytics, Azure Synapse Analytics serves as a data warehousing solution, and Azure Cache for Redis provides in-memory caching. These services offer varying levels of control, scalability, and compatibility to meet different application requirements.


### Azure Database for PostgreSQL Flexible Server

Offers more control and flexibility compared to the Single Server option. Flexible Server allows for greater customization of database configurations and supports **high availability** within a single availability zone or across multiple zones. It also provides cost optimization features, such as the ability to **stop and start the server**, and supports **burstable** compute tiers for workloads that don't require continuous compute capacity. Additionally, Flexible Server includes built-in connection **pooling with PgBouncer**, supports a wider range of PostgreSQL versions, and allows for co-location with application tiers to reduce latency. In contrast, Single Server has more limited configuration options and is on a retirement path, with recommendations to migrate to Flexible Server for enhanced features and capabilities

### Server creation

This script will create the server with **public connectivity**, which is obviously a bad choice for production workloads but will make access to the database more straightforward during lab time.

```bash
SQL_PASS=MyP@ssword$RANDOM
echo $SQL_PASS > sql_pass.txt

az postgres flexible-server create \
  --resource-group $USER-rg \
  --name $USER-app-db \
  --database-name conduit \
  --public-access 0.0.0.0 \
  --admin-user dbadmin \
  --admin-password $SQL_PASS \
  --tier Burstable \
  --sku-name Standard_B1ms 

az postgres flexible-server list --output table
  
```

### Firewall configuration

This step is optional, as the rule creation was already included in the server creation command.

```bash
MY_IP=$(curl ifconfig.me)

az postgres flexible-server firewall-rule create \
  --resource-group $USER-rg \
  --name $USER-app-db \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP \
  --output table
```

### Checking database

If required, use `cat sql_pass.txt` to know which password was used for creating the server.

```bash
sudo apt install postgresql-client-common postgresql-client -y

psql 
  --host=$USER-app-db.postgres.database.azure.com
  --port=5432
  --dbname=conduit
  --username=dbadmin
  --set=sslmode=require
```

## Application configuration

![A blueprint of a vault](images/blueprint-of-a-vault.jpg)

### App Configuration service

Azure App Configuration enables the **centralization of application settings** and **feature flags**. It is built on a simple **key-value** pair model. This service supports **hierarchical namespaces**, labeling, and extensive querying. Also integrates with other Azure services, enabling **dynamic configuration** updates without redeploying applications. While it provides encryption for data in transit and at rest, it is not intended for storing sensitive information like secrets.


### Azure Key Vault

Azure Key Vault is a cloud service designed to securely store and **manage sensitive information** such as cryptographic keys, secrets, and certificates. Key Vault supports **secrets management**, allowing users to securely store tokens, passwords, API keys, and other sensitive data. It also facilitates key management by enabling the creation and control of encryption keys used to protect data. Additionally, Key Vault manages digital certificates, helping with authentication and encryption processes.

Key Vaults are billed by number of operations, so it is advisable to use different vaults for different environments.

```bash
az provider register --name Microsoft.KeyVault
az keyvault create \
  --resource-group $USER-rg \
  --name $USER-app-vault \
  --enable-rbac-authorization
```

### Secret management authorization

When *RBAC authorization* is enable, the user must have the [proper role](https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide?tabs=azure-cli#azure-built-in-roles-for-key-vault-data-plane-operations) (authorization) assigned before creating or reading secrets.

*Key Vault Administrator* is required for storing secrets, but *Key Vault Secrets User* is enough for reading purposes.

```bash
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo The current subscription is $SUBSCRIPTION_ID.

USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)
echo The user identifier is $USER_PRINCIPAL_ID.

az role assignment create \
  --role "Key Vault Administrator" \
  --assignee $USER_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$USER-rg/providers/Microsoft.KeyVault/vaults/$USER-app-vault"
```

### Creating a new secret

First we retreive the connection string for the database.

```bash
CONN=$(az postgres flexible-server show-connection-string \
  --server-name $USER-app-db \
  --database-name conduit \
  --admin-user dbadmin \
  --admin-password $SQL_PASS \
  --query  "connectionStrings.\"ado.net\"" \
  --output tsv)
echo The connection string is $CONN.
```

Let's store the value of the connection string as a secret (double dashes are used for emulating a hierarchy in the plain key-value space of a vault):

```bash
az keyvault secret set \
  --vault-name $USER-app-vault \
  --name app--db \
  --value "$CONN"
```

And check if it exist

```bash
az keyvault secret show \
  --vault-name $USER-app-vault \
  --name app--db
```

## App Services

Platform as a Service (PaaS) is a cloud computing service model that provides a complete environment for developers to build, run, and manage applications without the complexities of managing the underlying infrastructure, reducing the burden of operating it.

Azure App Service is a PaaS offering from Microsoft for hosting web applications, REST APIs, and mobile back ends. It supports **multiple programming** operating systems, languages and frameworks. App Service provides a range of features such as automatic **scaling**, continuous **deployment**, security, and integration with other Azure services like authentication.

az appservice plan create \
  --resource-group $USER-rg \
  --name $USER-service-plan \
  --is-linux

az webapp create \
  --resource-group $USER-rg \
  --name $USER-app \
  --plan $USER-service-plan \
  --runtime "DOTNETCORE|8.0"

az webapp identity assign \
  --resource-group $USER-rg \
  --name $USER-app \


APP_PRINCIPAL_ID=$(az webapp identity show \
  --resource-group $USER-rg \
  --name $USER-app \
  --query principalId \
  --output tsv)
echo The indentity of the app is $APP_PRINCIPAL_ID.

SUBSCRIPTION_ID=$(az account show \
  --query "id" \
  --output tsv)
echo The subscription ID is $SUBSCRIPTION_ID.

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $APP_PRINCIPAL_ID \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$USER-rg/providers/Microsoft.KeyVault/vaults/$USER-app-vault


SECRET_URI=$(az keyvault secret show \
  --name app--db \
  --vault-name $USER-app-vault \
  --query id \
  --output tsv)
echo The secret URI is $SECRET_URI.

az webapp config appsettings set \
  --resource-group $USER-rg \
  --name $USER-app \
  --settings DB_CONN="@Microsoft.KeyVault(SecretUri=$SECRET_URI)"

az webapp config appsettings list \
  --resource-group $USER-rg \
  --name $USER-app \
  --output table

az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee $APP_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$USER-rg/providers/Microsoft.Storage/storageAccounts/${USER}repositorysa"

az webapp deploy \
  --resource-group $USER-rg \
  --name $USER-app \
  --src-url "https://${USER}repositorysa.blob.core.windows.net/appversions/app.zip" \
  --type 'zip' \
  --track-status

  
******************************************************
EXPIRY=$(date -u -d "1 day" '+%Y-%m-%dT%H:%MZ')
URL=$(az storage blob generate-sas --full-uri --permissions r \
  --expiry $EXPIRY \
  --account-name ${USER}repositorysa \
  -c appversions \
  -n app.zip \
  --output tsv)
az webapp deploy \
  --resource-group $USER-rg \
  --name $USER-app \
  --src-url $URL \
  --type 'zip' \
  --track-status

******************************************


az webapp deploy \
  --resource-group $USER-rg \
  --name $USER-app \
  --src-path /tmp/app.zip \
  --type 'zip' \
  --track-status

URL=$(az webapp show \
  --resource-group $USER-rg \
  --name $USER-app \
  --query "defaultHostName" \
  --output tsv)

APIURL=$URL ./run-api-tests.sh


 dotnet new web -o myminimalapp


## Networking

![Blueprint of multiple pipes and tubes, by Dall-E](images/blueprint-of-pumps-and-tubes.jpg)

[Azure Virtual Network](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) 
(VNet) is the fundamental building block for private networks 
in Azure, providing a **logically isolated network environment** in the cloud. 

Key components of a VNet include **subnets for segmentation**, **IP addresses** (both public and private), 
**Network Security Groups** (NSGs) for traffic control, and various connectivity options such as VPN gateways and ExpressRoute for hybrid cloud setups. 

VNets also support **service endpoints** for secure access to Azure services, and can be connected to other VNets, enabling resources in different VNets to communicate with each other.

Overall, VNets define the perimeter of an infrastructure deployed on Azure.

```bash
az network vnet create \
  --name $USER-vnet \
  --resource-group $USER-rg \
  --location westeurope \
  --address-prefix 192.168.0.0/16
```

### VNet and IP ranges


### Subnetting

Dividing a virtual network into subnets improves organization and segmentation of resources and allows increased security through granular access controls using Network Security Groups (NSGs). 

Subnets facilitate traffic management and resource isolation, allowing different types of resources (such as public and private) to be separated for better security and compliance.

Subnets on Azure spans through all the Availability Zones present in a region. Let's caculate the network range of two subnets, each one with a maximum of 1022 devices.

```bash
sudo apt-get install ipcalc -y
ipcalc 192.168.0.0/16 -s 1022 1022 
```

Now, we can use the result 

```bash
az network vnet subnet create \
  --resource-group $USER-rg \
  --vnet-name $USER-vnet \
  --name $USER-subnet-public \
  --address-prefix 192.168.0.0/22
```

### Network security groups

```bash
az network nsg create \
  --name $USER-web-nsg \
  --resource-group $USER-rg \
  --location westeurope
```

```bash
az network nsg rule create \
  --resource-group $USER-rg \
  --nsg-name $USER-web-nsg \
  --name AllowWebPorts \
  --protocol tcp \
  --direction inbound \
  --priority 500 \
  --source-address-prefix '*' \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range 80 8080 443 \
  --access allow
```

```bash
az network vnet subnet update \
  --resource-group $USER-rg \
  --vnet-name $USER-vnet \
  --name $USER-subnet-public \
  --network-security-group $USER-web-nsg
```




## Managed computation

## Databases











A split image with the left part depicting the blueprint of a simple starship and the right part the photorealistic realization of it. 
