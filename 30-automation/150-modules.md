# Terraform modules

## Definition

A Terraform module is **a collection of Terraform configuration files** located within the same directory. It serves as a container for multiple resources that are used together to define infrastructure components.

Modules provide **a way to encapsulate and organize related resources**, making it easier to manage complex configurations. They promote reusability by allowing you to define a set of resources once and then reference them from multiple places in your Terraform code. Modules also help maintain consistency across different parts of your infrastructure by providing a standardized way to configure and deploy resources.

## Module creation

If you have already completed the previous sections of the lab, you already have a module with the ability of deploying the Conduit API application.

## Module invocation

Create a new project for using your module:

```bash
cd
mkdir blog
cd blog
```

Write the template that will invoke the module. For the sake of the explanation, we will reduce the parameters to only one (`myprefix`), setting the rest of the expected information as property values:

```bash
cat << 'EOF' > main.tf

variable "myprefix" {
  type        = string
  description = "Unique prefix used for configuring resource names."
}

module "application" {
  source = "../tfinfra"

  region     = "West Europe"
  myprefix   = var.myprefix
  appversion = "1.0"
}

EOF
```

If needed, set the required subscription number:

```bash
export ARM_SUBSCRIPTION_ID="$(az account list \
  --query "[?isDefault].id" \
  --output tsv)"
```

And `apply` your template:

```bash
terraform apply -var myprefix=jmoreno -auto-approve
```

Remember deleting the whole stack once finished.

```bash
terraform apply \
  -var myprefix=jmoreno \
  -auto-approve \
  -destroy
```