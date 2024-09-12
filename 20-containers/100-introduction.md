# Containers: Introduction

## What is an Image?

An image is a snapshot of a hard drive content, typically including an operating
system, the required runtime and a single main application (process to run). The
image also contains metadata with information like which instruction should be 
executed to run that application.

It is a very convenient way for distributing applications with all their dependencies.

## What is a Container?

A container is an isolated process run under the supervision imposed by the Linux
kernel and attached to their own Linux namespaces to provide it with a encapsulated
view of the current host.

This view typically includes its own filesystem (based on an image with an additional
writeable layer), a communications stack with its own network interface, a separated tree of processes, etc.


## What is Docker?

Docker Inc. was the company responsible for creating modern tools that leveraged many Linux features for implementing the concept of a container, which is not a fundamental construct of that operating system. The tooling succeeded because of its excellent user experience.

The tools were also given the same name and primarily comprised a background server (the *Docker agent*, later evolved into `containerd`) and a command line interface to it (the *Docker client*, `docker`).

Regrettably, the company did not achieve financial sustainability and is no longer a key player in the container landscape.

## Configuring Docker

Let's start by installing both the agent and the client:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl \
  -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install \
  docker-ce docker-ce-cli \
  containerd.io docker-buildx-plugin \
  docker-compose-plugin
```

Add the current user to the *docker* group so it can connect to the agent:

```bash
sudo usermod -aG docker $USER
```

Start the agent:

```bash
sudo service docker start
```

Login again with the current user so changes in the groups are applied:

```bash
sudo su $USER
```

Now check that the client can access the agent:

```bash
docker version
```
