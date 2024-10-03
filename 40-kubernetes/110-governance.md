# Governance

As usual, define a unique prefix for creating your own resources:

```bash
export MYPREFIX=<your own prefix>
```

## Namespaces

One of the fundamental concepts in Kubernetes is the namespace, which allows for organizational segmentation within the same Kubernetes cluster. We are aiming to create a new namespace and set it as our current working context. This is particularly useful when we want to manage resources for different projects or environments (like staging or production) within the same cluster, a multitenant cluster or a with multiple different projects running on it.

we're going to create a YAML file that describes the new namespace, enabling GitOps practice to help us tracking the evolution of the cluster. This is a declarative way of managing Kubernetes resources, which is recommended for production environments. We use a heredoc (<< EOF) to create a file named demo-ns.yaml with the necessary configuration for the namespace.

```yaml
cat << EOF > demo-ns.yaml
apiVersion: v1
kind: N████████
metadata:
  name: $MYPREFIX
EOF
```

Before applying the configuration, we want to verify its content. The following command prints the content of the demo-ns.yaml file to the terminal, checking how the environment variable has been replaced:

```bash
cat demo-ns.yaml
```

Once we've confirmed that the configuration is correct, we instruct the cluster to add the namespace resource as part of the desired state.

```bash
kubectl ap███ -f demo-ns.yaml
```

To verify that the namespace has been created successfully, we use the `kubectl get ns` command. This lists all the namespaces in our current context, and we should see our new namespace in the list.

```bash
kubectl get ns
```

Now we want to check the detailed configuration of our new namespace. This is done using the same command again, but this time with the `-oyaml` flag and specifying our namespace. This will output the configuration of our namespace in YAML format.

```bash
kubectl get ns $MYPREFIX -oyaml
```

Finally, by settings our current context to the new namespace, we will not require explicitly referring to it during the rest of the sections.

```bash
kubectl config set-context \
  --namespace $MYPREFIX \
  --current
```