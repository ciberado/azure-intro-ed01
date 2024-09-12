# Containers: Deploying a containerized application

## Azure Container Registry

A *registry* is a database populated with images. A *repository* is a collection of images with different versions of the same application, identified by an image name and a particular *tag*. A *namespace* is a collection of images, usually grouped by vendor. Namespaces are useful to provide fine-grained access to the `image push` operation.

[Docker Hub](https://hub.docker.com/) is considered by the CLI as the default repository, but it is possible to refer to any other one by prepending it's address before the name of the image.

Creating a private repository is a very simple operation. Start by defining your own prefix so you can easily spot the resources that you will create:

```bash
export MYPREFIX=<your own MYPREFIX, like $USER or a random id>
```

Now create a resource group for the experiment:

```bash
az group create \
  --name $MYPREFIX-rg \
  --location westeurope
```

Activate the corresponding provider so you can later invoke the ACR API:

```bash
az provider operation show \
  --namespace Microsoft.ContainerRegistry \
  --output table

az provider register \
  --namespace Microsoft.ContainerRegistry
```

Creating a new container registry is very simple:

```bash
az acr create \
  --resource-group $MYPREFIX-rg \
  --name ${MYPREFIX}registry \
  --sku Basic
```

Find it in the available ones:

```bash
az acr list --output table
```

As stated before, the address of the server will be required to push and pull images. We will store it in a variable:

```bash
ACR_SERVER=$(az acr list \
  --query "[?name=='${MYPREFIX}registry'].loginServer" \
  --output tsv
)
echo ACR login server is: $ACR_SERVER.
```

## Pushing an image to ACR

Also, we will need to authenticate to the server before uploading images. The easier way to achieve it is by using the Azure CLI:

```bash
az acr lo███ --name $ACR_SERVER
```

The tag we set previously to our image doesn't include the server address nor the namespace. We will create a new tag for the same image with that information:

```bash
docker tag realworldapi $ACR_SERVER/training/realworldapi:latest
```

**Activity**: How do we specify which is the desired registry and a namespace for an image? How can we push the same image to several registries?

Now you can use the `push` command to send the image to the registry:

```bash
docker push $ACR_SERVER/training/realworldapi:latest
```

Once completed, feel free to search it in ACR (you will need to use the `az` CLI tool):

```bash
az acr repository list \
   --name ${MYPREFIX}registry \
   --output table
```

If needed, it is possible to also show the tags of the images:

```bash
az acr repository show-████ \
--name ${MYPREFIX}registry \
--repository training/realworldapi \
--output table
```

## Running the app with App Services

At the time of writing this tutorial, it is advisable to upgrade the `az` CLI tool with a beta version of the container plugin:

```bash
az extension add \
  --name containerapp \
  --upgrade \
  --allow-preview true
```

And always ensure that the corresponding providers are available in the current subscription:

```bash
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

Let's refresh the name of the images in the repository:

```bash
az acr show --name ${MYPREFIX}registry 
```

We will need the full ID of the ACR repo for configuring access permissions from the *App Service*, so we will save it in a variable:

```bash
ACR_ID=$(az acr show \
  --name ${MYPREFIX}registry \
  --query id \
  --output tsv)

echo "The full ID (scope) of the ACR is $ACR_ID."
```

The next step is creating a *Service Plan*. It has to be Linux, because good teachers don't teach their students to use Windows Containers 😉:


```bash
az appservice plan create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-service-plan \
  --is-linux
```

Deploying the app is very easy thanks to the extended functionality of the CLI. The command will even configure the managed identity of the application, providing it with permissions for pulling from the private repository:

```bash
az webapp create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --plan $MYPREFIX-service-plan \
  --assign-identity [system] \
  --role "AcrPull" \
  --scope $ACR_ID \
  --acr-use-████████ \
  --container-image-name $ACR_SERVER/training/realworldapi:latest
```

The whole process will take some minutes. It is possible to follow the log events to understand when it has finished:

```bash
az webapp log tail \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app
```

Now we can get address of our server and store it in a variable.

```bash
HOST=$(az webapp show \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --query "defaultHostName" \
  --output tsv)
echo The application is accessible at https://$HOST
```

Finally, feel free to point the test script to the new server and check how everything runs smoothly:

```bash
APIURL=https://$HOST ./run-api-tests.sh
```

