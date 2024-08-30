# Azure application architecture - App Service

Platform as a Service (PaaS) is a cloud computing service model that provides a complete environment for developers to build, run, and manage applications without the complexities of managing the underlying infrastructure, reducing the burden of operating it.

Azure App Service is a PaaS offering from Microsoft for hosting web applications, REST APIs, and mobile back ends. It supports **multiple programming** operating systems, languages and frameworks. App Service provides a range of features such as automatic **scaling**, continuous **deployment**, security, and integration with other Azure services like authentication.

## Service activation

Web Apps are part of the `Microsoft.App` provider. We will register it, and also
the `Microsoft.OperationalInsights` to have access to the observability features.

```bash
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

## App creation

An **App Service plan**, defines the **set of compute resources and configurations** required to host web applications, REST APIs, and mobile backends on the Azure platform. Each App Service plan is associated with a specific region and includes parameters such as the operating system (Windows or Linux), the number and size of virtual machine instances, and the **pricing tier** (ranging from Free to Premium). The pricing tier affects the features available, performance, and cost of the service. Users can scale their App Service plans up or down based on their application's needs, allowing for flexibility in resource allocation and management of costs.

Let's start by creating a Linux service plan:

```bash
az apps«ervice» p«lan» create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-service-plan \
  --is-l«inux»
```

And now setup the application itself with .Net 8 support:

```bash
az webapp create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --plan $MYPREFIX-service-plan \
  --r«untime» "DOTNETCORE|8.0"
```

Even if the command returns after a few seconds, several minutes may be required until all the infrastructure is correctly assinged and put in place. Run the `log tail` command and wait until entries appear on your screen. Alternatively, try to access the website and wait until the default application is returned.

```bash
az webapp log tail \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app
```

## App identity

A web app identity in Azure refers to a managed identity that allows Azure applications, such as those hosted on Azure App Service, to **authenticate to other Azure services** without needing to manage credentials explicitly. There are two types of managed identities: *system-assigned identities*, which are tied to a specific application and are deleted when the application is deleted, and *user-assigned identities*, which are standalone resources that can be assigned to multiple applications. Managed identities simplify the process of obtaining tokens for accessing Azure resources like Azure Key Vault or Azure SQL Database, enhancing security by eliminating the need for hard-coded secrets or credentials in the application code.

By default, apps don't have an identity. But it is straightforward to set up one for them:

```bash
az webapp i«dentity» assign \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app
```

Once this step is completed, we can get its name:

```bash
export APP_PRINCIPAL_ID=$(az webapp i«dentity» show \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --query principalId \
  --output tsv)
echo The indentity of the app is $APP_PRINCIPAL_ID.
```

## Key Vault access authorization

A role is required to access Azure Key Vault from an App Service due to Azure's role-based access control (RBAC) system, which governs permissions for accessing resources. When an App Service needs to retrieve secrets, keys, or certificates from a Key Vault, it must have an appropriate role assigned to its managed identity. This ensures that only authorized applications can access sensitive information, enhancing security and compliance.

```bash
export SUBSCRIPTION_ID=$(az account show \
  --query "id" \
  --output tsv)
echo The subscription ID is $SUBSCRIPTION_ID.
```

```bash
export SCOPE=/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$MYPREFIX-rg/providers/Microsoft.KeyVault/vaults/$MYPREFIX-app-vault

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $APP_PRINCIPAL_ID \
  --scope $SCOPE
```

## Key Vault integration 

A Key Vault reference in Azure App Configuration allows applications to securely reference secrets stored in Azure Key Vault **without exposing the actual secret** values. Instead of storing sensitive information directly within the application configuration, developers can use a **reference notation** that points to the secret's URI in Key Vault. The application must authenticate separately to both Azure App Configuration and Azure Key Vault to retrieve the referenced secrets, ensuring that sensitive data remains protected and access is controlled through Azure's role-based access control (RBAC) system.

Try first getting the unique identifier of the secret `app--db`:

```bash
export SECRET_URI=$(az keyvault secret show \
  --name app--db \
  --vault-name $MYPREFIX-app-vault \
  --query id \
  --output tsv)
echo The secret URI is $SECRET_URI.
```

Add a reference to it in the webapp configuration by setting the env variable:

```bash
az webapp c«onfig» appsettings s«et» \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --s«ettings» DB_CONN="@Microsoft.KeyVault(SecretUri=$SECRET_URI)"
```

Check that the command worked:

```bash
az webapp c«onfig» appsettings list \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --output table
```

## Application deployment

### From Azure Artifact Registry

Azure Artifact Registry is a **private repository** for storing and managing **software packages and container images** used in cloud applications. It supports various artifact types like Docker images, Maven packages, npm modules, and Debian packages. Artifacts are organized into repositories and namespaces for better management. **Developers can access the artifacts using standard tools** like Docker, Maven, or npm, with the registry URL, repository path, and tag or digest. Azure Artifact Registry integrates with other Azure services like AKS for deploying container workloads.

### From local computer

Deploying from a local file may be useful for testing purposes, or for creating build-and-deploy automated pipelines.

```bash
az webapp deploy \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --src-path /tmp/app.zip \
  --type 'zip' \
  --track-status
```

### From a Storage Account using SAS

Shared Access Signature (SAS) authorization in Azure Storage allows you to grant **limited access to specific resources** without sharing your account keys. It generates a token that specifies which resources can be accessed, the permissions granted (like read or write), and the duration for which the access is valid. There are two types of SAS: Service SAS, which is specific to a single storage service (like Blob or Queue), and Account SAS, which can provide access across multiple services. The client **includes the SAS token in requests** to Azure Storage, which verifies the token and checks if the requested operation is allowed based on the defined permissions. This method enables secure, temporary access to storage resources.

Compared to Role-Based Access Control (RBAC), Shared Access Signature (SAS) authorization **has several disadvantages**. SAS tokens provide limited flexibility and granularity, as they grant access based on predefined permissions without considering user attributes or context, which can lead to over-privileged access. Additionally, SAS tokens can be difficult to manage and revoke; once issued, they remain valid until they expire or the underlying key is regenerated, which can disrupt access for multiple users or services. In contrast, RBAC allows for more dynamic and context-aware access control, enabling organizations to easily adjust permissions as roles and responsibilities change, thus enhancing security and reducing the risk of unauthorized access.

First, we need to generate a SAS URL:

```bash
export EXPIRY=$(date -u -d "1 day" '+%Y-%m-%dT%H:%MZ')

SAS_URL=$(az storage blob generate-sas \
  --full-uri \
  --permissions r \
  --expiry $EXPIRY \
  --account-name ${MYPREFIX}repositorysa \
  --container-name appversions \
  --name app.zip \
  --output tsv)
```

And then it is possible to instruct the webapp to be deployed using that address
for retrieving the artifact:

```bash
az webapp deploy \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --src-url $SAS_URL \
  --type 'zip' \
  --track-status
```

### From a Storage Account using RBAC

RBAC provides **fine-grained access** management, allowing administrators to assign specific roles to users or groups, which simplifies permission management and reduces the risk of over-permissioning. In contrast, SAS tokens can create security vulnerabilities if not managed carefully, as they grant access without the same level of oversight and can be difficult to revoke. Additionally, RBAC **integrates with Azure’s identity management**, enabling better tracking and auditing of user activities, which is crucial for compliance and security.

Get the security identity of the application:

```bash
export APP_PRINCIPAL_ID=$(az webapp identity show \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --query principalId \
  --output tsv)
echo The indentity of the app is $APP_PRINCIPAL_ID.
```

Use that information to assign the `Storage Blob Data Contributor` role to the application,
restricting it to our storage account:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $APP_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$MYPREFIX-rg/providers/Microsoft.Storage/storageAccounts/${MYPREFIX}repositorysa"
```

Wait a few seconds until the changes are propagated and then order the deployment:

```bash
az webapp deploy \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --src-url "https://${MYPREFIX}repositorysa.blob.core.windows.net/appversions/app.zip" \
  --type 'zip' \
  --track-status
```

## Testing

Use `az webapp log tail` to start live log tracing for an Azure web application. If everything is ok, the application should start and show the connection string as part of the output. Interrupt it at any time using `ctrl+c`.

```bash
az webapp log tail \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app
``

Now feel free to run the test battery against the remote application:

```bash
HOST=$(az webapp show \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --query "defaultHostName" \
  --output tsv)
echo The application is accessible at https://$HOST

APIURL=https://$HOST ./run-api-tests.sh
```

