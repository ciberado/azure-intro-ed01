# Application lifecycle

## Deployments

A Deployment, in essence, is a blueprint for your application. It describes what container image to use, how many replicas (instances) should be running, and the **strategy to use when updates are required**. 

When a deployment is created, it also creates a ReplicaSet to ensure that the desired number of pods, which are the smallest deployable units in a Kubernetes cluster, are running at any given time. If a pod crashes or is deleted, the ReplicaSet ensures that a new one is created to maintain the desired state.

If a new version of the application is released, the deployment can be updated with the new container image, and Kubernetes will handle the rollout of the update (ensuring zero downtime and maintaining the availability of the application) by balancing the number of Pods in two different ReplicaSets.

Let's create the manifest:

```yaml
cat << EOF > demo-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: conduitdeployment
spec:
  replicas: 10
  selector:
    matchLabels:
      app: conduit
  template:
    metadata:
      labels:
        app: conduit
    spec:
      containers:
      - name: web
        image: ciberado/danjac-realworld:1.0
      - name: nginx
        image: ciberado/nginx
EOF
```

And apply it in the cluster:

```bash
kubectl apply -f demo-deployment.yaml
```

Check how the resource has been created, but also de ReplicaSet and Pods (see how they automatically receive a unique name):

```bash
kubectl get deployments,rs,pods
```

If you want, it is possible to access the application using the Service created in previous sections of the lab:

```bash
SERVICE_IP=$(kubectl get service conduitservice \
  --no-headers \
  -o custom-columns=":.status.loadBalancer.ingress[0].ip")

echo Open http://$SERVICE_IP in your browser.
```

Let's edit the manifest for upgrading the version of the deployed application to 2.0:

```bash
sed -i 's/1.0/2.0/g' demo-deployment.yaml
```

Check if the replacement has been done correctly:

```bash
cat demo-deployment.yaml
```

Set the new desired state of the cluster, and see how it converges in a few seconds. The Deployment will create a new ReplicaSet with the new configuration, and then it will start rebalancing the number of replicas between the former RS and this one. Press `Ctrl+c` for stopping the `--watch` command.

```bash
kubectl apply -f demo-deployment.yaml; \
kubectl get rs --watch
```

Feel free to open again the application in your browser:

```bash
SERVICE_IP=$(kubectl get service conduitservice \
  --no-headers \
  -o custom-columns=":.status.loadBalancer.ingress[0].ip")

echo Open http://$SERVICE_IP in your browser.
```

## Clean up

Just between you and me, a quick way of blasting out your data center. Use it with caution.

```bash
kubectl delete -f .
```