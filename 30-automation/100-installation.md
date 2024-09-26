## Introduction

### General concepts

**Declarative programming** simplifies the development process by allowing developers to focus on what they want to achieve rather than how to achieve it: developers describe a desired state structure, and the system infers what steps are required for moving the current configuration of the system to the required one. Thus, the code shows how the system should be, making it easy to understand what elements are expected to exists.

**Imperative programming** still has an important role, as many workflows (like disk snapshot, virtual machine isolation or log inspection) are easier to automate with this approach.

### Terraform installation

First, define a unique prefix so your resource names don't collision with any other person:

```bash
export MYPREFIX=<your own prefix, like $USER or a random id>
```

Now you can update the repository list in the machine and install `terraform` with:

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform -y
```

Alternatively, use [OpenTofu](https://opentofu.org/docs/intro/install/) as a truly open source implementation of the same technology.

In any case, once you have the command installed, ensure it works as expected:

```bash
terraform version
```
