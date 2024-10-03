# Complex package management

## Helm

Helm is essentially a **package manager** for Kubernetes. It is similar to apt/yum/homebrew, but for Kubernetes. It uses a packaging format called **charts**. A chart is a collection of files that describe a related set of Kubernetes resources. A single chart might contain any number of Kubernetes objects, all required to run an application, engine, or service.

Helm also provides the ability to rollback an upgrade or configuration change. This feature makes it easier
(up to a point) to manage complex systems and recover from issues. Helm maintains a history of releases, enabling developers to manage their application deployment lifecycle, update, rollback and debug deployed applications.

Helm also allows for easy configuration. You can parameterize your deployments and use the same chart to deploy to different environments (like development, staging, and production) by simply changing the configuration values.

Let's start by installing the tool:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## Deploying Wordpress

Now add the repository of *charts* (receipts) maintained by the incredible Sevillian people of Bitnami:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

Proceed to deploy Wordpress in your cluster:

```bash
helm install $PREFIX-wp bitnami/wordpress --set serviceType=LoadBalancer
```

Now you just need to follow the instructions on screen for accessing your shining Wordpress instance.

## Clean up

Delete the release:

```bash
helm delete $PREFIX-wp
```

