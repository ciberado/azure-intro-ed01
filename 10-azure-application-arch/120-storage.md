# Azure application architecture

## Storage

![A blueprint of a library](images/blueprint-of-a-library.jpg)

### Storage accounts

An Azure Storage Account is a fundamental component of Microsoft's cloud storage solution, providing a platform for storing various types of data. It acts as a container that groups together different Azure storage services, such as **Blob Storage** for unstructured data, **File Storage** for managed file shares, **Queue Storage** for message storage, and **Table Storage** for structured data.

Each storage account has a unique namespace accessible globally via HTTP or **HTTPS**, ensuring that data is highly available and protected through redundancy options.

Create a storage account that will serve as artifact repository:

```bash
az storage account create \
  --name ${PREFIX}repositorysa \
  --resource-group $PREFIX-rg \
  --sku Standard_LRS \
  --encryption-services blob
```

### Blob storage

Azure Blob Storage is an **object storage** service designed for storing large amounts of unstructured data, such as text and binary files. It supports three types of **blobs—block** blobs for documents and media, **append blobs** for logging, and **page blobs** for virtual machine disks.

Add a blob container to the previously created storage account:

```bash
az storage container create \
  --account-name ${PREFIX}repositorysa \
  --name appversions \
  --auth-mode login
```

### Transferring files

We will upload the zip artifact to the recentely created blob container.
**Explicit permission must be granted** to manipulate the container, even if
it has been created by the same user. That is why uploading a file to it
**will fail**:

```bash
az storage blob upload \
  --account-name ${PREFIX}repositorysa \
  --container-name appversions \
  --name app.zip \
  --file /tmp/app.zip \
  --auth-mode login
```

Before trying it again, a role with proper permissions must be assigned
to the current Azure user to provide access to the specific blob container.

```bash
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo Your current subscription is $SUBSCRIPTION_ID.
```

```bash
USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)
echo Your user identity is $USER_PRINCIPAL_ID.
```

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $USER_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$PREFIX-rg/providers/Microsoft.Storage/storageAccounts/${PREFIX}repositorysa"
```

**Wait a few seconds**, as the role assignment requires broad propagation. Now try to
upload the file again.

```bash
az storage blob upload \
  --account-name ${PREFIX}repositorysa \
  --container-name appversions \
  --name app.zip \
  --file /tmp/app.zip \
  --auth-mode login
```

Use the `list` command to ensure that the file has been correctly put in the blob container.

```bash
az storage blob list \
  --account-name ${PREFIX}repositorysa \
  --container-name appversions \
  --output table \
  --auth-mode login
```
