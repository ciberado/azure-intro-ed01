## Deployment

### Image creation

Download the source code of the application that we want to deploy:

```bash
cd
git clone https://github.com/Erikvdv/realworldapiminimal
cd realworldapiminimal
```

```bash
ls
```

Get the URL of the registry:

```bash
ACR_SERVER=$(az acr list \
  --query "[?name=='azintro${MYPREFIX}devregistry'].loginServer" \
  --output tsv
)
echo ACR login server is: $ACR_SERVER.
```

Fix the `Dockerfile` and build the image, setting the version at `1.0`:

```bash
sed -i s/6.0/8.0/g Dockerfile
docker build -t $ACR_SERVER/training/realworldapi:1.0 .
```

Login into it and push the image:

```bash
az acr login --name $ACR_SERVER

docker push $ACR_SERVER/training/realworldapi:1.0
```

Get the URL of the application. After a few minutes, you should be able to access it:

```bash
HOST=$(az webapp show \
  --resource-group azintro${MYPREFIX}dev-rg \
  --name azintro${MYPREFIX}dev-app \
  --query "defaultHostName" \
  --output tsv)
echo The application is accessible at https://$HOST
```

Send a few request to test the application. The next one should return a *not found* message.

```bash
curl https://$HOST; echo
```

But this other will tell you tell you that there are 0 articles:

```bash
curl https://$HOST/articles; echo
```

### Releasing new version

We will rewrite the application in *rust*, because, you know, *rust*. Once completed the process, we will deploy the new version.

Get the source code of the new version:

```bash
cd
git clone https://github.com/Retamogordo/realword-tide-sqlite-backend
cd realword-tide-sqlite-backend
```

Create a proper `Dockerfile` (we will add the `.dockerignore` in the next release ;)):

```bash
cat << EOF > Dockerfile
FROM rust:latest

WORKDIR /app
COPY . .

RUN cargo build

EXPOSE 3000

ENTRYPOINT ["cargo", "run"]
EOF
```

Build the image for the new version and push it to our registry:

```bash
docker build -t $ACR_SERVER/training/realworldapi:2.0 .
```

```bash
az acr login --name $ACR_SERVER
```

```bash
docker push $ACR_SERVER/training/realworldapi:2.0
```

Go back to the infrastructure project and update the *vars* file:

```bash
cd
cd tfinfra
```

```bash
sed -i "s/1/2/g" terraform-dev.tfvars
cat terraform-dev.tfvars
```

Check the changes that are going to be applied:

```bash
terraform plan \
  -var-file terraform-dev.tfvars
```

And redeploy the project with the new configuration:

```bash
terraform apply \
  -var-file terraform-dev.tfvars \
  -auto-approve
```

After a few minutes, you will be able to test the new version:

```bash
HOST=$(terraform output -raw web_server)
echo The application is accessible at https://$HOST
```

The deployment of the new version will probably take a few minutes. You can check the log using the following command:

```bash
az webapp log tail \
  --resource-group azintro${MYPREFIX}dev-rg \
  --name azintro${MYPREFIX}dev-app
```

Again, wait a few minutes as the new version becomes available. The behavior of the first test will change, as the rust implementation returns nothing in case of path error.

```bash
curl https://$HOST; echo
```

The correct path for getting the list of articles in this version is `/api/articles`:

```bash
curl https://$HOST/api/articles; echo
```

### Clean up

Delete the application terraform stack:

```bash
terraform apply \
  -d██████ \
  -var-file terraform-dev.tfvars \
  -auto-approve
```

And remove the remote backend:

```bash
az group delete \
  --resource-group $MYPREFIX-state-rg \
  --yes \
  --no-wait
```