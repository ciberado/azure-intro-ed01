# Kubernetes observability

## Prometheus components

Prometheus is the most popular solution for gathering metrics from Kubernetes. It was initially developed by SoundCloud as an internal tool, tailored specifically for **metrics collection** and not designed for tasks such as log aggregation or tracing.

The core of Prometheus is the Prometheus server, which stores the collected metrics in a time-based database. This database is designed to handle large amounts of data, enabling users to track metrics over time. To manage these metrics more effectively, users can create rules to group them according to certain criteria.

Beyond mere grouping, these rules can also be used to define alerts. In Prometheus, the **Alert Manager** is responsible for extracting the results of these rules and sending out notifications based on the defined alerts.

The **[PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/)** language allows users to search through the metrics and extract meaningful insights.

**Prometheus operator** simplifies the deployment of Prometheus and its associated components. It also includes **Grafana**, a tool for visualizing metrics. 

Prometheus collects metrics by accessing an **HTTP endpoint where the metrics are** published. This collection process is performed directly by the Prometheus server, either by **polling** these endpoints directly or through the use of `ServiceMonitors` and `PodMonitors`. These tools provide a way to regularly check the HTTP endpoints and collect the latest metrics.

In cases where the application doesn't use HTTP, a common practice is to use an `exporter`. An exporter is a service that can fetch metrics from a non-HTTP source and provide them in a format that Prometheus can access, typically over HTTP.

A typical record in Prometheus would include the metric name, the labels (which provide additional context), and the value of the metric. This structured format allows Prometheus to store and query the metrics efficiently.

See the following metric sample for better understanding how data should be published by the applications to be consumed by Prometheus:

```json
http_request_total{code="200",path="/status"} 2532`
```

## Preparation

Define your own unique prefix:

```bash
export MYPREFIX=<your very own prefix>
```

Create the `namespace` and set it as the preferred one. *Note*: we are going to use
imperative commands for simplicity.

```bash
kubectl create ns $MYPREFIX
kubectl config set-context --namespace $MYPREFIX --current
```

## Prometheus deployment

The Prometheus community supports a Helm Chart for installing both the Prometheus Operator and Grafana. We are going to leverage it so we can run our own copy of the observability system in the recently created namespace. *Note*: this is not a recommendation, as usually a single Prometheus instance is deployed in the cluster, or even shared between multiple clusters.

The first step is making sure we have the `helm` command in our system:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
  | bash
```

After it, we can add the chart repository and create a release:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install $MYPREFIX-mon prometheus-community/kube-prometheus-stack
```

Check the list of resources, including `deployments` and `statefulsets`:

```bash
kubectl get all
```

As you  See there are several `ServiceMonitor` already created, most of them attached to the infrastructure with `Exporter`s, gathering metrics from the system.

```bash
kubectl get servicemonitor
```

Feel free to explore the logs of some of the components, for example the `node-exporters` (that expose node metrics in Prometheus format). First, find the name of one of the Pods implementing this function:

```bash
EXPORTER=$(kubectl get pod \
  -l jobLabel=node-exporter \
  -o jsonpath={.items[0].metadata.name}\
)
echo The name of one Node Exporter is $EXPORTER.
```

And now use it for checking its logs:

```
kubectl logs $EXPORTER
```

## Publishing metrics from applications

We are going to use a demo application (`instrumented_app`) for generating some metrics. To do so, we will write the following manifest:

```yaml
cat << EOF > example.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: example-app
  template:
    metadata:
      labels:
        app: example-app
    spec:
      containers:
      - name: example-app
        image: fabxc/instrumented_app
        ports:
        - name: web
          containerPort: 8080
---
kind: Service
apiVersion: v1
metadata:
  name: example-app
  labels:
    app: example-app
spec:
  selector:
    app: example-app
  ports:
  - name: web
    port: 8080
EOF
```

And then we will apply it for creating three replicas:

```bash
kubectl apply -f example.yaml
```

Get the name of one of one of the `pods` deployed with the application, as we will want to see how it is exporting metrics.

```bash
APP=$(kubectl get pod \
  -l app=example-app \
  -o jsonpath={.items[0].metadata.name})
echo Your application pod is $APP.
```

Now we can jump into that Pod and send an *http* request to the `/metrics` endpoint of the application for simulating the Prometheus request:

```bash
kubectl exec $APP -it -- curl http://127.0.0.1:8080/metrics
```

Focus in a particular metric called `process_open_fds` (we will use it later).

```bash
kubectl exec $APP -it -- curl http://127.0.0.1:8080/metrics | grep process_open_fds
```

The Helm Chart configured Prometheus to look for `ServiceMonitor`s labeled in a specific way. Let's find what are those matching labels:

```bash
kubectl get prometheuses.monitoring.coreos.com \
  -o jsonpath={.items..spec.serviceMonitorSelector.matchLabels}; echo
```

We are going to create the `ServiceMonitor` that will instruct Prometheus to retrieve metrics from the associated pods. See how its property `release` matches the value obtained in the previous step, and thus it is included in the metrics harvesting process. Also, take note of the `matchLabels` section that will select the three replicas of our demo application.

```yaml
cat << EOF > monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: example-app
  labels:
    team: frontend
    release: $MYPREFIX-mon
spec:
  selector:
    matchLabels:
      app: example-app
  endpoints:
  - port: web
EOF
```

Don't be shy and create the resource:

```bash
kubectl apply -f monitor.yaml
```

## Accessing the Prometheus UI

Get the name of the *Prometheus server* `pod`:

```bash
PROMETHEUS=$(kubectl get pod \
  -l app.kubernetes.io/name=prometheus \
  -o jsonpath={.items..metadata.name})
echo Your Prometheus pod is $PROMETHEUS.
```

We will map the native Prometheus port (9090) to a public port in our workstation. To do so, and to avoid conflicts, we will first generate a random port number in the 8000-8999 range. Then, we will use it to set a tunnel between the workstation and the Prometheus UI.

```bash
PROMETHEUS_PORT=$(( ( RANDOM % 1000 )  + 8000 ))
kubectl port-forward $PROMETHEUS $PROMETHEUS_PORT:9090 \
  --address='0.0.0.0' &
PROMETHEUS_TUNNEL_PID=$!
echo Open your browser at http://YOURWORKSTATION:$PROMETHEUS_PORT for accessing the UI.
```

**Activity**: Now, you can point your browser to the user interface and explore it. Use the text box to retrieve the metric that we saw previously by typing `process_open_fds{job="example-app"}` on it.

You should see the current value of the metric on each replica (three lines in total). You can also use the *Graph* tab for visualizing its evolution.

## Accessing the Grafana dashboards

Grafana is the most popular dashboarding tool in the industry. The Prometheus community mantains a big set of visualizations that are incorporated by default in the instance deployed by the operator.

Let's find the name of the Grafana server Pod:

```bash
GRAFANA=$(kubectl get pod \
  -l app.kubernetes.io/name=grafana \
  -o jsonpath={.items..metadata.name}\
)
echo Your Grafana pod is $GRAFANA.
```

And we can now use the same tactic as before for publishing it through our workstation (the Grafana default port is 3000):

```bash
GRAFANA_PORT=$(( ( RANDOM % 1000 )  + 8000 ))
kubectl port-forward $GRAFANA $GRAFANA_PORT:3000 \
  --address='0.0.0.0' &
GRAFANA_TUNNEL_PID=$!
echo Open your browser at http://YOURWORKSTATION:$GRAFANA_PORT for accessing the UI.
```

The operator writes the authentication configuration in a Kubernetes [Secret](https://kubernetes.io/docs/concepts/configuration/secret/). Take a look at it:

```bash
kubectl describe secret $MYPREFIX-mon-grafana
```

And now, decode its properties (we can do that because our user has the right permissions for it):

```bash
USERNAME=$(kubectl get secret \
  $MYPREFIX-mon-grafana \
  -o jsonpath="{.data.admin-user}" \
 | base64 --decode)
echo Grafana username is $USERNAME.

PASSWORD=$(kubectl get secret \
  $MYPREFIX-mon-grafana \
  -o jsonpath="{.data.admin-password}" \
 | base64 --decode);
echo Grafana password is $PASSWORD.
```

**Activity**: Now open the Grafana URL in your browser, where you'll need to input your username and password. Once logged in, navigate to the `General/Home` dashboard by clicking on its link (upper left corner). From there, proceed to select the `Kubernetes / Compute Resources / Cluster dashboard` (or use the search function for finding it). You should see the current CPU utilization of the cluster.

Feel free to explore other boards. Once you are familiar with Grafana, **ask the trainer** if you can launch launch the stress test and see how the CPU goes up.

```bash
for i in {1..5}
do   
  kubectl run  \
    --image ███████████████ \
    stress-$RANDOM \
    --image-pull-policy IfNotPresent \
    --restart Never \
    --  -t 180 -c 1
  sleep 30
done
```

## Extra ball: writing a Prometheus-friendly application

We'll set up a .NET web API project and integrate it with Prometheus. To get started, we need to create a new web API project and navigate into the project directory:

```bash
dotnet new webapi -o MetricsApi
cd MetricsApi
```

Next, we need to add the Prometheus .NET client to our project. This package allows our application to expose metrics in a format that Prometheus can scrape and store. It provides several default metrics, and it is easy to add custom ones.

```bash
dotnet add package prometheus-net.AspNetCore
```

Now, let's configure our application to use Prometheus. We'll add the necessary namespaces, create a new web application builder, add controllers to the services container, and then build the application. After that, we'll use the Prometheus middleware to expose metrics at the `/metrics` endpoint and collect HTTP metrics.

```C#
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

var app = builder.Build();

// Use Prometheus middleware
app.UseMetricServer(); // Exposes metrics at /metrics
app.UseHttpMetrics();  // Collects HTTP metrics

app.MapControllers();

app.Run();
```

To start the application, we'll run it with a specified URL. In this case, we'll use localhost on port 8888.

```bash
dotnet run --urls=http://localhost:8888
```

Finally, we can test that our metrics endpoint is working correctly by sending a `GET` request to it. We should see a list of metrics in Prometheus format. *Note*: the application will be kept at foreground, so you can use another tmux window for the next step.

```bash
curl localhost:8888/metrics
```

## Cleanup

First, remove the tunnels:

```bash
kill -9 $GRAFANA_TUNNEL_PID
kill -9 $PROMETHEUS_TUNNEL_PID
```

And now, delete the Helm release:

```bash
helm uninstall $MYPREFIX-mon
```

Finally, eliminate the rest of resources:

```bash
kubectl delete ns $MYPREFIX
```
