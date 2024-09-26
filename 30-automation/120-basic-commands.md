## Basic commands

### Workspaces

A Terraform workspace contains the state of a deployed template. It is useful for deploying the same configuration on several regions, or on different environments. After an `init` command the current workspace is going to be `default`:

```bash
terraform workspace list
```

But it is easy to create new workspaces:

```bash
terraform workspace new dev
terraform workspace list
```

To change from one to another, use the `select` subcommand:

```bash
terraform workspace select default
terraform workspace list
```

```bash
terraform workspace select dev
terraform workspace list
```

### Code validation

The `fmt` command checks the template syntax, but after initializing the project it is possible to use the `validate` command for a deeper testing:

```bash
terraform validate --json
```

### Template execution

Version 4 of the Azure provider requires explicit subscription settings. A flexible approach for doing it consists in defining an environment variable:

```bash
export ARM_SUBSCRIPTION_ID="$(az account list \
  --query "[?isDefault].id" \
  --output tsv)"

echo Your subscription is $ARM_SUBSCRIPTION_ID.
```

It is usually important to check what resources and outputs are going to be created when the template is finally executed. This can be useful for, for example, approving merge requests. Pay special attention to the `Changes to Outputs:` section.

```bash
terraform p███
```

Although no actual resources have been defined, it is possible to actually execute the current template just for understanding the workflow. Check how the command explains you how many resources were affected by it (0, in this case):

```bash
terraform a████ -auto-approve 
```

Another very useful command is `show`, as it allows to present the current state file configuration in a readable way:

```bash
terraform show
```

If only a list of resources is required, the `list` subcommand makes more sense:

```bash
terraform state list
```
