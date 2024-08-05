# Manually deploying an application to Azure

The goal of this session will be to migrate an application to Azure, understanding basic identity concepts and resource organization. We will also introduce the most important services, including Storage Accounts, Virtual Networks, App Services, Azure Vault and Azure Database for Postgresql Flexible Server.

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
cd src/Api/bin/Debug/net8.0/
dotnet build
```

#### Running locally

The API will (by default) start at port 5000.

```bash
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

## Azure

![Blueprint of a neightborhood, by Dall-E](images/blueprint-of-a-neightborhood.jpg)

A split image with the left part depicting the blueprint of a simple starship and the right part the photorealistic realization of it. 

### API vs Portal

### Physical infrastructure

#### Regions

#### Availability Zones

### Logical organization

#### Accounts and Tenants

#### Management groups

#### Subscriptions

#### Resource groups

## Networking

![Blueprint of multiple pipes and tubes, by Dall-E](images/blueprint-of-pumps-and-tubes.jpg)

[Azure Virtual Network](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) 
(VNet) is the fundamental building block for private networks 
in Azure, providing a **logically isolated network environment** in the cloud. 

Key components of a VNet include **subnets for segmentation**, **IP addresses** (both public and private), 
**Network Security Groups** (NSGs) for traffic control, and various connectivity options 
such as VPN gateways and ExpressRoute for hybrid cloud setups. 

VNets also support **service endpoints** for secure access to Azure services, and can be connected 
to other VNets, enabling resources in different VNets to communicate with each other.

Overall, VNets define the perimeter of an infrastructure deployed on Azure.

### VNet and IP ranges

### Subnetting



```bash
sudo apt-get install ipcalc -y
ipcalc 192.168.0.0/16 -s 254 254 
```

### 


## Storage

## Managed computation

## Databases