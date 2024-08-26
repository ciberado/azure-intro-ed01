# Manually deploying an application to Azure

## Application configuration

![A blueprint of a vault](images/blueprint-of-a-vault.jpg)

### App Configuration service

Azure App Configuration enables the **centralization of application settings** and **feature flags**. It is built on a simple **key-value** pair model. This service supports **hierarchical namespaces**, labeling, and extensive querying. Also integrates with other Azure services, enabling **dynamic configuration** updates without redeploying applications. While it provides encryption for data in transit and at rest, it is not intended for storing sensitive information like secrets.


### Azure Key Vault

Azure Key Vault is a cloud service designed to securely store and **manage sensitive information** such as cryptographic keys, secrets, and certificates. Key Vault supports **secrets management**, allowing users to securely store tokens, passwords, API keys, and other sensitive data. It also facilitates key management by enabling the creation and control of encryption keys used to protect data. Additionally, Key Vault manages digital certificates, helping with authentication and encryption processes.

Key Vaults are billed by number of operations, so it is advisable to use different vaults for different environments.

Not all services are active by default in each subscription. Most of them must be
registered before accessing them, as you can see using the next command:

```bash
az provider list --output table 
```

Let's ensure that the Key Vault service is registered:

```bash
az provider register --name Microsoft.KeyVault
```

Now it is possible to create a new vault:

```bash
az keyvault create \
  --resource-group $PREFIX-rg \
  --name $PREFIX-app-vault \
  --enable-rbac-authorization
```

### Secret management authorization

When *RBAC authorization* is enable, the user must have the [proper role](https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide?tabs=azure-cli#azure-built-in-roles-for-key-vault-data-plane-operations) (authorization) assigned before creating or reading secrets.

*Key Vault Administrator* is required for storing secrets, but *Key Vault Secrets User* is enough for reading purposes.

```bash
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo The current subscription is $SUBSCRIPTION_ID.

USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)
echo The user identifier is $USER_PRINCIPAL_ID.
```

```bash
az role assignment create \
  --role "Key Vault Administrator" \
  --assignee $USER_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$PREFIX-rg/providers/Microsoft.KeyVault/vaults/$PREFIX-app-vault"
```

### Creating a new secret

First we retreive the connection string for the database.

```bash
export CONN=$(az postgres flexible-server show-connection-string \
  --server-name $PREFIX-app-db \
  --database-name conduit \
  --admin-user dbadmin \
  --admin-password $SQL_PASS \
  --query  "connectionStrings.\"ado.net\"" \
  --output tsv)
echo The connection string is $CONN.
```

Let's store the value of the connection string as a secret (double dashes are used for emulating a hierarchy in the plain key-value space of a vault):

```bash
az keyvault secret set \
  --vault-name $PREFIX-app-vault \
  --name app--db \
  --value "$CONN"
```

And check if it exist

```bash
az keyvault secret show \
  --vault-name $PREFIX-app-vault \
  --name app--db
```
