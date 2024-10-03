# Preparation

Before we start creating our Kubernetes cluster in Azure, we will set a prefix that we'll use to name all the resources we'll create. This way, we'll avoid naming conflicts with other resources that might already exist in your Azure account. 

```bash
export CLUSTER_PREFIX=training
```

## Infrastructure creation

Now that we've set our unique prefix, we're ready to create a resource group in Azure:

```bash
az group create \
  --name $CLUSTER_PREFIX-aks-rg \
  --location "West Europe"
```

With our resource group in place, we can proceed to create our Kubernetes cluster. In this step, we're creating a cluster with 3 nodes using the CLI. We're also generating SSH keys for secure communication with our nodes.

```bash
az aks create \
  --resource-group $CLUSTER_PREFIX-aks-rg \
  --name $CLUSTER_PREFIX-aks \
  --node-count 3 \
  --generate-ssh-keys
```

## Client configuration

Now that our Kubernetes cluster is up and running, we need to configure our local environment to interact with the cluster. We'll use the Azure CLI to fetch and set the necessary credentials in our local `kubeconfig` file. It will contain the authentication information required for establishing communication with the cluster, and additional information like its API endpoint.

```bash
az aks ███-credentials \
  --resource-group $CLUSTER_PREFIX-aks-rg \
  --name $CLUSTER_PREFIX-aks
```

To ensure that our local environment is correctly set up, let's check the content of our `kubeconfig` file. This file holds the details about clusters, contexts, and other configuration details. We'll first list the files in the .kube directory and then inspect the content of the config file.

```bash
ls .kube
cat .kube/config | less
```

To interact with our Kubernetes cluster, we'll need the Kubernetes command-line tool, `kubectl`. The following commands download the latest stable version of kubectl, make it executable, and move it to a directory included in our system's PATH.

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/kubectl
```

To verify that `kubectl` is correctly installed and can interact with our Kubernetes cluster, let's check its version. This command will display the client **and server** versions, which can be helpful for troubleshooting purposes.

```bash
kubectl version
```

## Basic resource exploration

`kubectl` has a very consistent interface. Most reading operations use the command `get` followed by a resource type (and optionally, a concrete resource name). For example, the next command wil list the nodes of the cluster:

```bash
kubectl get █████
```

`get` operations provide by default a human-friendly result, that can be extended with the requiring a *wider* output:

```bash
kubectl get █████ -owide
```

To get all the available information in a convenient way, `yaml` is usually a good option:

```bash
kubectl get █████ -o████ \
  | less -R
```

Finally, to make working with JSON data easier, we'll install a command-line JSON processor called jq. We'll then use it to pretty-print our nodes' JSON data. This command will highlight the JSON output, making it easier to read and understand.

```bash
sudo apt update && sudo apt-get install jq -y

kubectl get █████ -o████ \
  | jq -C \
  | less -R
```