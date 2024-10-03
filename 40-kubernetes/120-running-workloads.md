# Running workloads

## Local application execution

In this part of the tutorial, we will be working on deploying a web application using Docker and Kubernetes. The application we're using for this demonstration is a real-world app versioned by [Danjac](https://github.com/danjac/realworld).

Run the application in your laptop and play a little bit with it:

```bash
docker run \
  --rm \
  --name ${PREFIX}_demo \
  --detach \
  -p 8080:3000 \
  ciberado/danjac-realworld:1.0

MY_IP=$(curl -s https://ifconfig.me)
echo Open http://$MY_IP:8080 to see the application in action.
```

Remove the local container, as we plan to deploy it on the cluster:

```bash
docker rm --force ${PREFIX}_demo
```

## Pod deployment

A Kubernetes pod is the smallest and simplest **unit of deployment** in the Kubernetes object model that you can create or deploy. A pod represents a single instance of a running process in a cluster and can contain one or more containers. Containers within a pod **share an IP address** and port space, and can communicate with one another using localhost. They can also share storage volumes.

Pods are designed to support **co-located**, co-scheduled, co-managed helper programs, such as content management systems, file and data loaders, local cache managers, etc. Pods serve as a unit of deployment, horizontal scaling, and replication in Kubernetes.

However, it's important to note that Pods are generally ephemeral, **disposable entities**. They are not designed to survive failures, meaning if a Pod goes down, Kubernetes does not resurrect it.

We need to create a Kubernetes Pod to host our application. The Pod will contain two containers - one for our web application and another for an Nginx server. The later will implement a QoS filter, limiting the invocation rate of the API.

```yaml
cat << EOF > demo-pod.yaml
apiVersion: v1
kind: P██
████████:
  name: conduit
  labels:
    app: conduit
    type: webapp
████:
  containers:
  - name: web
    image: ciberado/danjac-realworld:1.0
  - name: nginx
    image: ciberado/nginx
EOF
```

After creating the YAML file, we need to apply it to our Kubernetes cluster. The cluster will try to make us happy converging into the desired state that we have defined.

```bash
kubectl apply -f demo-pod.yaml
```

We can use the kubectl get pods command to view the status of all Pods in the default namespace of the context.

```bash
kubectl get pods
```

If more details are required, the `-owide` argument can be helpful.

```bash
kubectl get pod conduit -owide
```

And to get even more detailed information about our newly created Pod, we can use the `-oyaml` options.

```bash
kubectl get pod conduit -oyaml
```

## Basic status check and troubleshooting

We can also view the logs of our Pod. This can be particularly useful for debugging purposes. As our Pod contains two containers, it is mandatory to explicit which one we want to access.

```bash
kubectl logs conduit w██
kubectl logs conduit n████
```

For checking the application from our local machine, we can map a pod port  using the `kubectl port-forward command`. This command allows you to manage the network traffic from your local machine to a specific pod in your Kubernetes cluster, similarly to what a *ssh tunnel* does.

Let's map the port `8000` of our machine to the port `80` of the Pod, managed by the Nginx application.

```bash
kubectl port-forward conduit ████:██ &
echo Open http://$MY_IP:8000 to see the application in the cluster!
```

Feel free to use a `kill -9` command for stopping the port forwarding.

We can also execute commands directly in one of the Pod's containers. This can be useful for performing debugging, maintenance, or other administrative tasks.

```bash
 kubectl e███  conduit web -- ls /app
```

It is even possible to run interactive sessions against the containers:

```bash
kubectl e███ -it conduit web -- bash
`` 

In the next few commands, we are interacting with the application directly. We list the files in the application directory, send a request to the application using curl, and then exit the container.

```bash
root@conduit:/app# ls
root@conduit:/app# curl localhost:3000
root@conduit:/app# exit
```

