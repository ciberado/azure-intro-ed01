# Containers

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
sudo service docker start

sudo su $USER
docker version

https://hub.docker.com/search?q=busybox

docker search busybox --limit 5

docker search busybox --filter is-official=true

wget -q -O - "https://hub.docker.com/v2/namespaces/library/repositories/busybox/tags?page_size=100" | grep -o '"name": *"[^"]*' | grep -o '[^"]*$' | less


https://gallery.ecr.aws/search?searchTerm=nginx

docker image pull nginx
docker image pull public.ecr.aws/nginx/nginx

docker image ls

sudo apt install -y jq

docker pull busybox
docker image save busybox | gzip > busybox.tar.gz

mkdir -p ./temp/busybox/
tar -xvf busybox.tar.gz -C ./temp/busybox

cat temp/busybox/index.json | jq

cat temp/busybox/manifest.json | jq

CONFIG=$(cat temp/busybox/manifest.json | jq .[0].Config -r)

cat temp/busybox/$CONFIG

ROOTFS=$(cat temp/busybox/$CONFIG | jq .rootfs.diff_ids[0] -r)

tar tvf temp/busybox/blobs/sha256/${ROOTFS:7} | less

docker container run busybox ls /

docker ps

docker ps --all

docker container run --name mybox --interactive --tty busybox sh
/ # echo Hi > hello.txt
/ # exit

docker ps --filter name=mybox --all

docker container start mybox

docker container exec mybox cat hello.txt

docker container exec -it mybox sh

/ # ls
/ # cat hello.txt
/ # exit

docker container rm mybox # Fail

docker container stop mybox # 30 seconds, as SIGTERM is being managed
docker container rm mybox

docker container run --name myotherbox -it -v $(pwd):/myhostdisk busybox

/ # ls /myhostdisk
/ # echo "Hello from the box." > /myhostdisk/hellofromcontainer.txt
/ # cat /myhostdisk/hellofromcontainer.txt
/ # exit

ls
cat hellofromcontainer.txt


echo "Danger!" > /etc/danger.txt # Fails

docker container run --name mydangerousbox -it -v /etc:/myhostdisk busybox

/ # ls /myhostdisk
/ # echo "Danger!" > /myhostdisk/danger.txt
/ # exit

cat /etc/danger.txt


docker run --detach --name webserver -p 8000:80 nginx

curl localhost:8000

docker logs webserver

docker logs webserver --follow




dotnet new console -n helloworld
cd helloworld
ls
cat Program.cs

dotnet build

ls
ls bin/

dotnet run

ls bin/Debug/net8.0
./bin/Debug/net8.0/helloworld

https://learn.microsoft.com/en-us/dotnet/architecture/microservices/net-core-net-framework-containers/general-guidance



docker mcr.microsoft.com/dotnet/aspnet:8.0

docker pull mcr.microsoft.com/dotnet/sdk:8.0

distroless: https://github.com/dotnet/dotnet-docker/blob/main/documentation/ubuntu-chiseled.md

docker pull mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled

docker image ls | grep mcr


docker run -it -v $(pwd):/app -w /app mcr.microsoft.com/dotnet/sdk bash

:/app# pwd
:/app# ls
:/app# dotnet build
:/app# dotnet run
:/app# exit


cat << EOF > .dockerignore
bin
obj
EOF

ls -a
cat .dockerignore

cat << EOF > Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0

WORKDIR /app

COPY . .

RUN dotnet build

ENTRYPOINT ["dotnet", "run"]
EOF

docker build -t helloworld .
docker image ls "hello*"

docker container run helloworld

cat << EOF > Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /app

COPY . .

RUN dotnet build

FROM mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled AS publish

WORKDIR /app
COPY --from=build /app/bin/Debug/net8.0/helloworld* /app/

ENTRYPOINT ["/app/helloworld"]
EOF

docker build -t helloworld:publish .

docker image ls helloworld

docker container run helloworld:publish

git clone https://github.com/Erikvdv/realworldapiminimal
cd realworldapiminimal

cat .dockerignore
cat Dockerfile

sed -i s/6.0/8.0/g Dockerfile

docker build -t realworldapi .

docker image ls realworldapi

docker container run --detach --name realworld -p 8080:8080 realworldapi
docker logs realworld


wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/Conduit.postman_collection.json
wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/run-api-tests.sh
chmod +x ./run-api-tests.sh

APIURL=http://localhost:8080 ./run-api-tests.sh

docker container rm --force realworld


https://learn.microsoft.com/en-us/azure/container-registry/container-registry-concepts

```bash
export PREFIX=<your own prefix, like $USER or a random id>
```

az group create \
  --name $PREFIX-rg \
  --location westeurope

az acr create \
  --resource-group $PREFIX-rg \
  --name ${PREFIX}registry \
  --sku Basic \
  --admin-enabled false

az acr list --output table

ACR_SERVER=$(az acr list \
  --query "[?name=='${PREFIX}registry'].loginServer" \
  --output tsv
)
echo ACR login server is: $ACR_SERVER.

az acr login --name $ACR_SERVER

docker tag realworldapi $ACR_SERVER/training/realworldapi:1.0.0

docker push $ACR_SERVER/training/realworldapi:1.0.0

az acr repository list \
   --name ${PREFIX}registry \
   --output table

az acr repository show-tags \
--name ${PREFIX}registry \
--repository training/realworldapi \
--output table


az extension add --name containerapp --upgrade --allow-preview true


az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

az acr update \
  --resource-group $PREFIX-rg \
  --name ${PREFIX}registry \
  --anonymous-pull-enabled false \
  --admin-enabled false

az identity create \
  --resource-group $PREFIX-rg \
  --name ${PREFIX}appidentity

APP_IDENTITY=$(az identity show \
  --resource-group $PREFIX-rg \
  --name ${PREFIX}appidentity \
  --query principalId \
  -o tsv)
echo The security identity of the application is: $APP_IDENTITY.


REGISTRY_SCOPE=$(az acr show \
  --name ${PREFIX}registry \
  --query id \
  -o tsv)
echo The full scope of the regitry is $REGISTRY_SCOPE.

az role assignment create \
   --assignee $APP_IDENTITY \
   --role "AcrPull" \
   --scope $REGISTRY_SCOPE

az role assignment list \
   --assignee $APP_IDENTITY \
   --scope $REGISTRY_SCOPE

APP_IDENTITY_SCOPE=$(az identity show \
  --resource-group $PREFIX-rg \
  --name ${PREFIX}appidentity \
  --query id \
  --output tsv)
echo The scope of the application identity is $APP_IDENTITY_SCOPE.


https://azure.github.io/java-aks-aca-dapr-workshop/modules/09-bonus-assignments/04-managed-identities/2-managed-identities-in-aca.html

Assign the UMI:



az containerapp env create \
  --name ${PREFIX}appenv \
  --resource-group $PREFIX-rg

 az containerapp create -n $ACA_NAME  -g $ACA_RG_NAME --image $IMAGE_NAME --environment $ACA_ENV_NAME --registry-server $ACR_SERVER_NAME --registry-identity $MI_RESOURCE_ID --ingress external --target-port 80 --min-replicas 1

az containerapp create \
  --name my-container-app \
  --resource-group $RESOURCE_GROUP \
  --image $CONTAINER_IMAGE_NAME \
  --environment $CONTAINERAPPS_ENVIRONMENT \
  --registry-server $REGISTRY_SERVER \
  --registry-username $REGISTRY_USERNAME \
  --registry-password $REGISTRY_PASSWORD

