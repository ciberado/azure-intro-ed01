## Infrastructure definition

### Inputs and configuration flexibility

As any other program, a Terraform template can received parameters. They are called *variables* and can be mandatory or optional. Let's define two of them:

```bash
cat << 'EOF' > variables.tf
variable "region" {
  description = "Azure region."
  type        = string
  default     = "West Europe"
}

variable "myprefix" {
  type        = string
  description = "Unique prefix used for configuring resource names."
}

variable "appversion" {
  type        = string
  description = "Tag corresponding to the container image."
}
EOF
```

Some of the variables (`myprefix`, `appversion`) are mandatory, so we need to supply at least a value for them. It can be done using the `-var` parameter of the common subcommands, but it is usually easier to maintain and track if stored in a file. *Note*: we will use the already defined `MYPREFIX` env variable for creating the file.

```bash
cat << EOF > terraform-dev.tfvars
region     = "West Europe"
myprefix   = "${MYPREFIX}dev"
appversion = "1.0"
EOF

cat terraform-dev.tfvars
```

`locals` are another way of facilitating code readability: they are the equivalent to *constants* in other languages. We will add one called `prefix` to the `main.tf` file. To summarize, we have:

* The `MYPREFIX` environment variable, used during the lab for convenience.
* The `myprefix` terraform variable, acting as an input parameter for the template.
* The `prefix` local, used for making code easier to read.

If the value of the variable `myprefix` is `demo`, then the local `prefix` will contain `azintrodemo` and it will be used as the first particle in the resources that we will create later.

```bash
cat << 'EOF' >> main.tf

locals {
  prefix = "azintro${var.myprefix}"
}
EOF
```

```bash
cat main.tf
```

### Resources

Resources are the main configuration elements. They define the desired state of the infrastructure. Let's start by adding the most basic one:

```bash
cat << 'EOF' >> main.tf

resource "azurerm_resource_group" "group" {
  name     = "${local.prefix}-rg"
  location = var.region

  tags     = {
    "Project" : local.prefix
  }
}
EOF
```

The execution plan is going to be much more interesting now. See how a new resource will be created, with some property values already in place and some awaiting assignment.

```bash
terraform plan -var-file=terraform-dev.tfvars
```

Let's run the template. Terraform will calculate the diff between the existing state and the desired one, and then use the provider for executing the changes:

```bash
terraform apply \
  -var-file terraform-dev.tfvars \
  -auto████████
```

Let's see if everything is in place:

```bash
az group list \
  --query "[?contains(name, '$MYPREFIX')].{Name:name}" \
  --output table
```

It is also interesting to understand how different workspaces are mapped to individual state files on the remote backend:

```bash
az storage blob list \
  --account-name ${MYPREFIX}tfstate \
  --container-name tfstate \
  --auth-mode login \
  --output table
```

Usually, the *registry* would be considered cross-project infrastructure (and thus, placed in an independent template). But we will treat it just like any other resource during this lab for the sake of simplicity. The same can be said about the *service plan*, depending of the architectural decisions of the project.

```bash
cat << 'EOF' >> main.tf

resource "azurerm_container_registry" "registry" {
  name                = "${local.prefix}registry"
  resource_group_name = azurerm_resource_group.group.name
  location            = azurerm_resource_group.group.location
  sku                 = "Standard"
  admin_enabled       = true

  tags     = {
    "Project" : local.prefix
  }
}

resource "azurerm_service_plan" "plan" {
  name                = "${local.prefix}-service-plan"
  location            = azurerm_resource_group.group.location
  resource_group_name = azurerm_resource_group.group.name
  os_type             = "Linux"
  sku_name            = "B2"

  tags     = {
    "Project" : local.prefix
  }
}
EOF
```

The configuration of the application is easy to understand. The most interesting part is the specification of the image version: avoid using mutable tags, like `latest`, to ensure that the configuration is fully traceable in time. Also, it's worth noting the request for automatically attaching a security identity to the application.

```bash
cat << 'EOF' >> main.tf

resource "azurerm_linux_web_app" "app" {
  name                = "${local.prefix}-app"
  location            = azurerm_resource_group.group.location
  resource_group_name = azurerm_resource_group.group.name
  service_plan_id     = azurerm_service_plan.plan.id

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = false
  }

  site_config {
    always_on                               = true
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = "training/realworldapi:${var.appversion}"
      docker_registry_url = "https://${azurerm_container_registry.registry.login_server}"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags     = {
    "Project" : local.prefix
  }
}
EOF
```

Our last resource attaches a *role* to the application's identity, so it can authenticate itself against the private repository:

```bash
cat << 'EOF' >> main.tf

resource "azurerm_role_assignment" "acr_pull" {
  principal_id                     = azurerm_linux_web_app.app.identity[0].principal_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.registry.id
  skip_service_principal_aad_check = true
}
EOF
```

Finally, it is convenient to provide additional information in the outputs of the template:

```bash
cat << 'EOF' >> output.tf

output "acr_server" {
  value = azurerm_container_registry.registry.login_server
}

output "web_server" {
  value = azurerm_linux_web_app.app.default_hostname
}
EOF
```

We have added quite a few elements. Let's make sure everything is ok:

```bash
terraform validate
```

Now it's big time! Apply the template again for updating all the resources:

```bash
terraform apply \
  -var-file terraform-dev.tfvars \
  -auto-approve 
```

The list of resources has grown up:

```bash
terraform state list 
```

You can check the website to see if it exists, although **currently the deployment has failed** since we haven't created the image:

```bash
HOST=$(terraform output -raw web_server)
echo Check https://$HOST for accessing the site.
```
