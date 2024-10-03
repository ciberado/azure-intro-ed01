# HA and scalability


## ReplicaSets

A  ReplicaSet ensures a **specified number of identical pod replicas** are running at any given time. Its primary goal is to provide fault-tolerance and high availability. If a pod crashes or is deleted, the ReplicaSet controller will **automatically create a new one** to replace it. This ensures that the application remains available to users even when individual pods fail. Additionally, ReplicaSets help in achieving **load balancing** by distributing traffic between multiple replicas of a pod, thereby improving the overall performance of the system.

Let's define the resource manifest:

```yaml
cat << EOF > demo-replicaset.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: conduitreplicaset
  labels:
    app: conduit
spec:
  r███████: 2
  selector:
    matchLabels:
      app: conduit
  template:
    metadata:
      labels:
        app: c██████
    spec:
      containers:
      - name: web
        image: ciberado/danjac-realworld:1.0
      - name: nginx
        image: ciberado/nginx
EOF
```

We will ask the cluster to make us happy by applying the resource.

```bash
kubectl apply -f demo-replicaset.yaml
```

The main resource will be available in no time, as it is basically a controller run in the control plane of the cluster:

```bash
kubectl get rs
```

After a few seconds, the replicas should also be online.

```bash
kubectl get pods
```

*Activity*: How can a service point to all the replicas of a ReplicaSet?

## Scaling out

Next, we will simulate a situation where the load on our web application increases and we need to scale up. We will modify our `demo-replicaset.yaml` file to increase the number of replicas from 2 to 10. 

```bash
sed -i 's/replicas: 2/replicas: 10/g' demo-replicaset.yaml
cat demo-replicaset.yaml
```

Then, we will apply the updated configuration to our Kubernetes cluster and check the status of our ReplicaSet and pods again. We run both commands in the same prompt so you get a better view of what is happening in the system. Press `Ctrl+c` for stopping the `watch`.

```bash
kubectl apply -f demo-replicaset.yaml; \
kubectl get rs --watch
```

The ReplicaSet has automatically created multiple Pods, each one with its own unique name:

```bash
kubectl get pods
```


## Clean up

Feel free to remove the RS, as we will not need it anymore:

```bash
kubectl delete -f demo-replicaset.yaml
kubectl get pods
```