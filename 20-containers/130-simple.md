# Containers: Containerizing an application (simple example)

## Writing the application

Let's use the `dotnet` CLI for creating a *helloworld* application, and take a look at the generated source code:

```bash
dotnet new console -n helloworld
cd helloworld
ls
cat Program.cs
```

Build the application and see how the artifacts are created:

```bash
dotnet build
ls
ls bin/
```

Run the application to get familiarized with its behavior. It is a very simple program that writes a message to the standard output.

```bash
dotnet run
```

The `dotnet` command is not required, in fact you can run the application directly:

```bash
ls bin/Debug/net8.0
./bin/Debug/net8.0/helloworld
```

## Choosing an image

There are three main options to be considered as the best base for a .Net application, as explained in the [documentation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/net-core-net-framework-containers/official-net-docker-images):


* `mcr.microsoft.com/dotnet/aspnet:8.0`, that includes the CLI and the development kit.
* `mcr.microsoft.com/dotnet/sdk:8.0`, that comes only with the runtime.
* `mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled`, a *distroless* image suitable for compact deployment (see the [repository](https://github.com/dotnet/dotnet-docker/blob/main/documentation/ubuntu-chiseled.md) for more information).

Download all of them and compare their size:

```bash
docker pull mcr.microsoft.com/dotnet/aspnet:8.0
docker pull mcr.microsoft.com/dotnet/sdk:8.0
docker pull mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled

docker image ls | grep mcr
```

Try using the `sdk` image to manually build the application **inside** a container:

```bash
docker run \
  -it \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/dotnet/sdk:8.0 bash
```

Once inside the container, you should be able to go ahead with the same previously used commands:

```bash
:/app# ls
:/app# dotnet build
:/app# dotnet run
:/app# exit
```

## Preparing the context

As we are going to build the image inside a container, there is no need to copy the binary files in the context provider to the `docker build` command. Use a `.dockerignore` file to get rid of them:

```bash
cat << EOF > .dockerignore
bin
obj
EOF
```

Feel free to check the content of the fail that you just created:

```bash
ls -a
cat .dockerignore
```

## Running the first version

Our first approach will copy the source code to the container and build it from there. You can use the [Dockerfile documentation](https://docs.docker.com/reference/dockerfile/) to better understand the details.

```bash
cat << EOF > Dockerfile
F███ mcr.microsoft.com/dotnet/sdk:8.0

# Sets the current directory to /app
████DIR /app

# Copy the source code to the container, from the context
COPY . .

RUN dotnet build # Build the application

# Run the application on container creation
ENTRY█████ ["dotnet", "run"]
EOF
```

The **text is redacted**, so you will need to use an editor (`vim`, `nano`, [`micro`](https://micro-editor.github.io/)...) for fixing it.

Execute the `Dockerfile` for building the image, naming it as `helloworld:basic`. The last parameter in the command provides the directory for the *context*, usually the current one (represented by a `.`).

```bash
docker b████ -t helloworld:basic .
```

Check that we have the image in our local repository:

```bash
docker image ls "hello*"
```

Finally, execute a container based on the image:

```bash
docker container run helloworld:basic
```

## Multistage building

Multi-stage building in Docker is a technique that allows developers to **use multiple `FROM` statements** within a single Dockerfile, each representing a distinct stage of the build process. This approach enables the separation of the build environment from the final runtime environment, allowing users to compile and package applications in one stage and then copy only the necessary artifacts to a much **smaller final image** in another stage. By doing so, multi-stage builds help reduce the overall size of the Docker image, eliminate unnecessary build dependencies, and enhance security by minimizing the attack surface of the final container. This results in cleaner, more efficient images that are easier to manage and deploy.

First, let's write a `Dockerfile` with an `build` and a `publish` stage, the first one based on the `SDK` image and the second one on the *distroless*.

```bash
cat << EOF > Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS buildstage

WORKDIR /app

COPY . .

RUN dotnet build

FROM mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled AS publishstage

WORKDIR /app
COPY --from=bu████████ /app/bin/Debug/net8.0/helloworld* /app/

ENTRYPOINT ["/app/helloworld"]
EOF
```

Again, **edit the `Dockerfile` for clearing the redacted part**. Now it's time to create the image and see how it compares to the previous one:

```bash
docker build -t helloworld:publish .

docker image ls helloworld
```

Of course, feel free to run the new version of the application:

```bash
docker container run helloworld:publish
```

