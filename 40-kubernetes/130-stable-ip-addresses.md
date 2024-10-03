# Stable IP addresses

## Service deployment

The purpose of a Service is to enable the **discovery** of applications running in Pods and provide a single, **stable IP** address and DNS name by which these applications can be accessed. They also manage **load balancing** and track the **health** of the Pods, redirecting traffic to available Pods in case some fail. Services can be exposed in different ways by specifying a type in the ServiceSpec, such as `ClusterIP`, `NodePort`, `LoadBalancer`, and `ExternalName`.

A `LoadBalancer` service in Kubernetes is used to expose your application to external network traffic. When you set a service to the `LoadBalancer` type, it gets an external IP address through which outside users can access the application. Usually, an actual infrastructure load balancer (like an Azure Load Balancer, for example) is deployed, and it routes incoming traffic from this external IP to the pods that are part of the service, effectively making your application available to users outside of the Kubernetes cluster.

Let's define the corresponding manifest:

```yaml
cat << EOF > demo-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: conduitservice
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: conduit
  type: L███████████
EOF
```

**Activity**: how will know the service to which Pod it should forward the traffic?

Now ask the cluster to create it:

```bash
kubectl apply -f demo-service.yaml
```

Wait until the `external-ip` becomes defined (press `Ctrl+c` for stopping the command:

```bash
kubectl get services --watch
```

See the details of the resource that you just created:

```bash
kubectl get service -oyaml
```

## Checking the QoS of the application

By leveraging [JMESPath](https://jmespath.org) expressions, it is possible to extract the
value of the public IP of the infrastructure load balancer created by the service:

```bash
SERVICE_IP=$(kubectl get s██████ conduitservice \
  --no-headers \
  -o custom-columns=":.status.loadBalancer.ingress[0].ip")

echo Open http://$SERVICE_IP in your browser.
```

Let's test the QoS component provided by Nginx. Each few request, the `curl` command should
be throttled.

```bash
curl -ILs -X GET $SERVICE_IP/?[1-20] | grep HTTP
```

**Activity**: Use `port-forward` for mapping the **Service** port to a port of your laptop.

## Clean up

We will not need the Pod anymore, so we can delete it:

```bash
kubectl delete -f demo-pod.yaml
```