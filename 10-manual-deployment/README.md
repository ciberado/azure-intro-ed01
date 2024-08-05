# Manually deploying an application to Azure

The goal of this session will be to migrate an application to Azure, understanding basic identity concepts and resource organization. We will also introduce the most important services, including Storage Accounts, Virtual Networks, App Services, Azure Vault and Azure Database for Postgresql Flexible Server.

## The Real World project

### Download and install

git clone https://github.com/Erikvdv/realworldapiminimal

### Local building

dotnet build src/Api/Api.csproj /property:GenerateFullPaths=true /consol
eloggerparameters:NoSummary /p:Configuration=Debug /p:Platform="AnyCPU"

### Local run

```bash
cd src/Api/bin/Debug/net8.0/
dotnet Api.dll
```

### Test

wget https://github.com/gothinkster/realworld/blob/main/api/Conduit.postman_collection.json
wget https://github.com/gothinkster/realworld/blob/main/api/run-api-tests.sh
chmod +x ./run-api-tests.sh
APIURL=http://localhost:5000/ ./run-api-tests.sh

## Networking

## Storage

## Managed computation

## Databases