# Azure application architecture - Preparation

## The [Real World](https://github.com/gothinkster/realworld) project

The purpose of GitHub's real-world project initiative is to provide developers with **practical learning experiences** through actual project implementations. These projects aim to bridge the gap between theoretical knowledge and real-world application development by offering complete, functional codebases that demonstrate how various technologies, frameworks, and best practices are used in production-ready applications.

GitHub's RealWorld project **has approximately 100 implementations** available. The most popular technologies used in GitHub's RealWorld project implementations include a diverse range of programming languages and frameworks. Notable mentions are JavaScript frameworks like React, Vue.js, and Angular; Python; Ruby; Go; PHP; Elixir with the Phoenix framework; Java; and C# for .NET technologies. Additionally, mobile development frameworks such as Flutter and Xamarin.Forms are included, along with database technologies like PostgreSQL. This variety reflects the broad spectrum of options available to developers for creating production-ready applications.

## Local install and run

### NodeJS support

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

### .Net 8 for Linux & Windows

The backend application consists in a C# implemantion of the API. We will need
to build and execute it.

Linux:
```bash
sudo apt-get update \
  && sudo apt-get install -y dotnet-sdk-8.0
dotnet --version
```

Windows:
```bash
choco install dotnet-8.0-sdk
```

### Source code download

Only the backend application will be used during this training.

```bash
git clone https://github.com/Erikvdv/realworldapiminimal
cd realworldapiminimal
```

### Source code changes

Later on, we will inject the database connection string as application configuration.
We want to check that it has been succesfully added, so we will add a few lines in the
source code to print the value of the environment variable.

```bash
sed -i '67a\
     \
    // Here we would open a connection to the Postgres server\
    var DB_CONN = Environment.GetEnvironmentVariable("DB_CONN");\
    Console.Out.WriteLine($"The connection string value would be: {DB_CONN}");\
' src/Api/Program.cs
```

### Local building

The application will generate several `.dll` files.

```bash
dotnet dotnet publish --configuration Release
```

### Running locally

The API will (by default) start at port 5000. Check the output of the application to see
how it prints the provided connection

```bash
cd src/Api/bin/Release/net8.0/publish
DB_CONN=fake_connection dotnet Api.dll &
```

### Testing

A [Postman collection](https://www.postman.com/collection/) is a **set of HTTP-based
tests** that can be executed by several tools, incluidng [Newman](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/) (wrapped in a bash script).

Get the *Conduit* collection and use it for checking that the application is running fine:

```bash
wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/Conduit.postman_collection.json
wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/run-api-tests.sh
chmod +x ./run-api-tests.sh

APIURL=http://localhost:5000 ./run-api-tests.sh
```

### Packaging

To make it simple, we will start by zipping the whole application:

```bash
sudo apt install zip -y

zip -r /tmp/app.zip .
```
