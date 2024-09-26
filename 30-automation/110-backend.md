## Backend preparation

A **Terraform state file is a record of the infrastructure** that Terraform manages. It maps real-world resources to your configuration and keeps track of metadata. The state file is used to determine what changes to make to your infrastructure to reach the desired state specified in your configuration.

A **Terraform backend is a configuration that determines where Terraform stores its state file**, which tracks the current state of your infrastructure. By default, Terraform saves this state locally on your filesystem, but when working in teams or managing production environments, using a remote backend is recommended. Remote backends allow multiple users to access and collaborate on the same infrastructure state without conflicts, ensuring consistency and preventing issues like state file corruption or loss.

Common remote backends include Amazon S3, Azure Blob Storage, and Google Cloud Storage. During this lab, we will use the second option.

### Infrastructure creation

Let's start by creating a separate resource group for containing the backend state files:

```bash
az group create \
  --resource-group $MYPREFIX-state-rg \
  --location westeurope
```

Now we need to initialize a *storage account* with a *blob container*. Azure's *blobs* can be locked for exclusive use, so that's is all that will be needed for safely storing the state information.

```bash
az storage account create \
  --resource-group $MYPREFIX-state-rg \
  --name ${MYPREFIX}tfstate \
  --sku Standard_LRS \
  --encryption-services blob

az storage container create \
  --account-name ${MYPREFIX}tfstate \
  --auth-mode login \
  --name tfstate
```

### Granting access to the administrator

We want to be able to see what files are created inside the *blob container*. The best way to achieve it is by assigning a role to our current user, as by default not even the creator of the *storage account* is able to list the content of it.

```bash
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo Your current subscription is $SUBSCRIPTION_ID.

USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)
echo Your user identity is $USER_PRINCIPAL_ID.

az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $USER_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/${MYPREFIX}-state-rg/providers/Microsoft.Storage/storageAccounts/${MYPREFIX}tfstate"
```

Use the following command for listing the content of the recently created container. It should be empty. Beware: **permission propagation may take a few seconds**.

```bash
az storage blob list \
  --account-name ${MYPREFIX}tfstate \
  --container-name tfstate \
  --auth-mode login \
  --output table
```

### Providers, backends, data and outputs

Terraform is based on modules: small processes than are run co-located with the main one, implementing each function required by the system.

**Providers are responsible for implementing low-level platform interactions**. A separate provider is required for each target within your infrastructure. In the context of a public cloud, it is typical to configure a distinct provider for each region that the template needs to interact with.

**State files describe the known condition of the infrastructure** at a specific moment. As previously mentioned, **backends are storage mechanisms used for saving these state files**. In Azure, it is very common to use a *blob container* for this purpose.

**Data elements enable the querying of information sources**, making them accessible to others. The types of available `data` elements depend on the initialized providers.

**Outputs are pieces of information that we want to retain once the template has been deployed**. They are either required by other components or they provide valuable information to the engineer deploying the infrastructure.

### Project creation

Create a directory for our project. To facilitate this lab, the whole infrastructure will be contained in a single file with all the required resources, something that usually goes against the best practices.

```bash
cd
mkdir tfinfra
cd tfinfra
```

All the `*.tf` files in the current directory are considered a single template. Although it's common to confine them to a single `main.tf` file, during this lab, we will distribute the content across different files for easier management.

Let's start by creating three of them, one for the provider configuration, another for the resources and the last one for the program outputs.

```bash
cat << 'EOF' > provider.tf
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.1"
    }
  }

  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}
EOF
```

Most of the elements are defined in *blocks*. They start with the type of element (`data`, in the next example), then indicating the class that will determine the intended effect (`azurerm_subscription` will retrieve the current subscription number) and finally an arbitrary logical identifier that will be unique in the current template (`current`) and should semantically represent the functionality of the block.

```bash
cat << 'EOF' > main.tf
data "azurerm_subscription" "current" {
}
EOF
```

```bash
cat << 'EOF' > output.tf
output "current_subscription_display_name" {
  value = data.azurerm_subscription.c██████.display_name
}
EOF
```

### Source code linting

Use the following command to check if the source code of the project follows the strict Terraform convention:

```bash
terraform f██ -check
```

In case the linting test is not passed, the format can be corrected using the same command without any argument:

```bash
terraform f██
```

### Backend initialization

The `terraform` command doesn't directly contain any logic related to any platform. Instead, it executes the `init` subcommand, which automatically downloads the declared elements. By default, it searches for these elements in the [Terraform Registry](https://registry.terraform.io).

Let's use it providing additional information for configuring the backend.

```bash
terraform init \
     -backend-config "resource_group_name=${MYPREFIX}-state-rg" \
     -backend-config "storage_account_name=${MYPREFIX}tfstate" \
     -backend-config "container_name=tfstate" \
     -backend-config "key=${MYPREFIX}/tfstate"
```

The previous command has downloaded a set of dependencies (plugins). You may be interested in looking at them:

```bash
ls -a
ls .terraform
```

**Activity**: find the executable `terraform-provider-azurerm_*` under that directory structure. Run it with the parameter `--help` to check how Terraform plugins are just binaries that will be run in parallel to the main orchestrator command.

The local state file will be minimum, as it is mainly pointing to the *blob container* configured previously:

```bash
cat .terraform/terraform.tfstate
```

Again, just as a reminder, you can always check the actual state file in the cloud:

```bash
az storage blob list \
  --account-name ${MYPREFIX}tfstate \
  --container-name tfstate \
  --auth-mode login \
  --output table
```
