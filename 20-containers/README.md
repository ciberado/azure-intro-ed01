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

