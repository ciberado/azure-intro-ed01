# Application insights

In this tutorial, we're going to walk through the process of setting up Application Insights for a web application in Azure. Application Insights is a feature of Azure Monitor that provides comprehensive monitoring and diagnostics for applications running in Azure, other cloud environments, or on-premises. It collects telemetry data from your app, allowing you to troubleshoot performance issues and understand how users are interacting with your application. Our goal is to create a resource group, an App Service plan, a web application, and a Log Analytics workspace, all within the Azure environment. Then, we'll create an Application Insights component and link it to our web application.

## WebApp creation

First, we're setting an environment variable MYPREFIX that will be used to create unique names for the resources we're going to create. This is a common practice to avoid naming conflicts in Azure.

```bash
export MYPREFIX=<Choose your own unique prefix>
```

Next, we're creating a resource group in the "West Europe" location. Remember: a resource group is a logical container for resources deployed on Azure.

```bash
az group create  \
  --name $MYPREFIX-rg   \
  --location "West Europe"
```

After creating the resource group, we're setting up an App Service plan. This represents the set of compute resources for hosting the web app. We're specifying that we want to use a *b2* SKU, which is a basic tier that includes 2 CPU cores and 3.5 GB of RAM, and we're opting for a Linux host.

```bash
az appservice plan create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-service-plan \
  --sku b2 \
  --is-linux
```

Now we're ready to create the web application itself. We're specifying that it should be hosted within the resource group and App Service plan we created earlier, and that it should use the .NET Core 8.0 runtime.

```bash
az webapp create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --plan $MYPREFIX-service-plan \
  --runtime "DOTNETCORE|8.0"
```

## Application Insights creation

Next, we're creating a Log Analytics workspace in the same resource group. This workspace will be used to store log data from Application Insights, and it is the currently recommended way of setting up Application Insights storage.

```bash
az monitor log-analytics w████████ create \
  --resource-group $MYPREFIX-rg \
  --workspace-name $MYPREFIX-laws \
  --location "West Europe"
```

In the following command, we're retrieving the ID of the Log Analytics workspace we just created and storing it in a variable. This ID will be used later to link the Application Insights component to the workspace.

```bash
WORKSPACE_ID=$(az monitor log-analytics w████████ show  \
  --resource-group $MYPREFIX-rg   \
  --workspace-name $MYPREFIX-laws \
  --query id \
  --output tsv)
echo Your Workspace ID is $WORKSPACE_ID.
```

Now we're creating an Application Insights component in the same resource group. We're specifying that it's a web application and linking it to the Log Analytics workspace using the ID we retrieved earlier.

```bash
az monitor app-insights component c█████ \
    --resource-group $MYPREFIX-rg \
    --app $MYPREFIX-insights \
    --location "West Europe" \
    --application-type web \
    --workspace $WORKSPACE_ID
```

The next command shows the properties of the Application Insights component we just created. This can be useful for troubleshooting or for getting an overview of the component's settings.

```bash
az monitor app-insights component show\
    --resource-group $MYPREFIX-rg \
    --app $MYPREFIX-insights
```

## WebApp configuration

Next, we're retrieving the instrumentation key of the Application Insights component. This key is used to connect the web application to the Application Insights component, allowing the component to collect telemetry data from the app.

```bash
INST_KEY=$(az monitor app-insights component show  \
  --resource-group $MYPREFIX-rg \
  --app $MYPREFIX-insights \
  --query i████████████████y \
  --output tsv)
echo "Your (secret) instrumentation key is $INST_KEY."
```

Finally, we're setting the instrumentation key as an application setting for the web app. This completes the setup process and allows Application Insights to start collecting data from the app.

```bash
az webapp config appsettings set \
    --resource-group $MYPREFIX-rg \
    --name $MYPREFIX-app \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY="$INST_KEY"
```

## WebApp deployment

Continuing from our previous steps, we now have our web application and Application Insights set up in Azure. The next step is to deploy our actual application code to the Azure web app. For this tutorial, we will be using an existing .NET Core application hosted on Github.

First, we'll clone the application repository to our local machine using the git clone command. We then navigate into the project directory.

**Activity**: Invest a few minutes looking at the source code of the [demo](https://github.com/ciberado/apidemo). Open `Program.cs` and `test.sh` to better understand how Application Insights is integrated with your code.

```bash
git clone https://github.com/ciberado/apidemo
cd apidemo
```

Next, we're going to build and publish our .NET Core application. We're using the `dotnet publish` command with the `Release` configuration. This command compiles the application, reads through its dependencies specified in the project file, and publishes the resulting set of files to a directory.

```bash
dotnet publish --configuration Release
```

After publishing the application, we navigate to the directory where the published files are located. We then create a zip file containing all the published files. This zip file will be deployed to the Azure web app.

```bash
rm /tmp/app.zip
cd bin/Release/net8.0/publish/
zip -r /tmp/app.zip .
cd ../../../..
```

Finally, we deploy the zip file to the Azure web app using the `az webapp deploy` command. We specify the resource group and the name of the web app, as well as the path to the zip file. We also specify that we're deploying a zip file and that we want to track the status of the deployment. This command uploads the zip file to the web app and extracts the files, effectively deploying the application. Once the deployment completes, our web application will be up and running in Azure, monitored by Application Insights.

```bash
az webapp deploy \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --src-path /tmp/app.zip \
  --type 'zip' \
  --track-status
```

## Testing

Now that we have deployed our application, we want to ensure that it's accessible and functioning as expected. Additionally, we want to start analyzing the telemetry data collected by Application Insights.

First, we're retrieving the default host name of the web app using the `az webapp show` command. This is the URL at which our web application is accessible. We're storing this URL in a variable and then printing it out.

```bash
HOST=$(az webapp show \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app \
  --query "defaultHostName" \
  --output tsv)
echo The application is accessible at https://$HOST
```

Manually check that the application itself is running as expected:

```bash
curl $HOST/weatherforecast | jq
```

Next, we're making a shell script executable and running it. This script, `test.sh`, is a simple test script that sends requests to our web application and checks the responses. We're passing the host name of the web app to the script so it knows where to send the requests.

```bash
chmod +x test.sh
./test.sh $HOST
```

**Note**: this script will be executed in foreground, so open a new terminal or create a different tmux window for continue working with the instance. Remember to set again the `MYPREFIX` variable in case is required.

Finally, we're executing a query against the telemetry data collected by Application Insights. We're using the `az monitor app-insights q████` command, specifying the Application Insights component and the resource group. The query itself is requesting a count of all requests made to our application, summarized by hour. This gives us a simple overview of the usage of our application over time, which can be useful for understanding patterns of usage and identifying potential issues. We're also specifying an offset of 1 hour, which means the data returned by the query will be from the past hour.

**Note**: It may take **up to five minutes** to get the first results! Be patient.

```bash
az monitor app-insights q████ \
  --app $MYPREFIX-insights \
  --resource-group $MYPREFIX-rg  \
  --analytics-query 'requests | summarize count() by bin(timestamp, 1h)'  \
  --offset 1h
```

The following query will summarize the slowest requests during the last ten minuts:

```bash
az monitor app-insights q████ \
  --app $MYPREFIX-insights \
  --resource-group $MYPREFIX-rg  \
  --analytics-query 'requests | summarize avg(duration) by name | top 5 by avg_duration desc'  \
  --offset 10m \
  --output yaml
```

The next one will divide the last hour in 10 minute intervals and summarize the number of requests received by the application on each segment. It will be more useful once the test tool has been working for more than thirty minutes.

```bash
az monitor app-insights q████ \
  --app $MYPREFIX-insights \
  --resource-group $MYPREFIX-rg  \
  --analytics-query 'requests | where timestamp > ago(1h) | summarize count() by bin(timestamp, 10m)'  \
  --offset 1h \
  --output yaml
```

For log retrieving, you may use the table `trace`. The next command will show the raw result:

```bash
az monitor app-insights q████ \
  --app $MYPREFIX-insights \
  --resource-group $MYPREFIX-rg \
  --analytics-query 'traces | limit 5'
```

This one, on the other side, will retreive the content of the first trace:

```bash
az monitor app-insights q████ \
  --app $MYPREFIX-insights \
  --resource-group $MYPREFIX-rg \
  --analytics-query 'traces | limit 1'  \
  | jq ".tables[].rows[][4] | fromjson"
```


## Dashboards

Azure Portal includes many advanced monitoring options. We are going to get the required information for building the URLs associated to them, starting by the tenant id and name. We will also require the current subscription id:

```bash
TENANT_ID=$(az account show \
  --query homeTenantId \
  --output tsv)
echo Your tenant id is: $TENANT_ID.

TENANT_DOMAIN=$(az rest \
  --method get \
  --url '/tenants?api-version=2020-01-01'  \
  | jq ".value[] | select(.tenantId == \"$TENANT_ID\") | .displayName" -r
)
echo Your tenant domain: $TENANT_DOMAIN.

SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo Your subscription is $SUBSCRIPTION_ID.
```

Now, let's use the information we've gathered to generate some URLs. These URLs will direct us to different parts of the Application Insights overview panel in the Azure portal. The first URL will take us to the overview panel for our Application Insights resource.

```bash
echo Open the following link to view the Application Insights overview panel:

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/overview"
```

Azure Application Insights Map is a feature within Azure Monitor that provides a visual representation of the architecture and interactions between various components of an application.

```bash
echo Open the following link to view the Application Insights Map:

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/applicationMap"
```

Azure Application Insights Live Metrics is a feature that allows real-time monitoring of web applications with a latency of about one second. It provides immediate insights into key performance indicators such as incoming request rates, request durations, and failure rates, enabling developers to quickly assess the impact of changes or deployments on application performance. Live Metrics does not store historical data; instead, it displays telemetry for the last 60 seconds, making it useful for immediate diagnostics without impacting application performance.

```bash
echo Open the following link to view the Application Insights Live Metrics:

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/quickPulse"
```

Azure Application Insights Failure is a feature that captures and analyzes errors, exceptions, and issues occurring within an application. It provides insights into failure rates, allowing developers to quickly diagnose problems by correlating failed requests with specific exceptions.

```bash
echo Open the following link to view the Application Insights Failure report:

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/failures"
```

Azure Application Insights Live Performance provides insights into key performance indicators such as request rates, response times, and failure rates.

```bash
echo Open the following link to view the Application Insights Live Performance report:

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/performance"
```

Azure Log Analytics is a tool within Azure Monitor that enables users to collect, analyze, and visualize log data from various Azure and non-Azure resources. It uses Kusto Query Language ([KQL](https://learn.microsoft.com/en-us/kusto/query/?view=microsoft-fabric)) to allow for complex queries and real-time analysis of log data, helping to identify trends, troubleshoot issues, and monitor system performance.

```bash
echo Open the following link to view the Application Insights log analytics and search for the "Failed request - top 10" report and open it.

echo "https://portal.azure.com/#@${TENANT_DOMAIN}/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${MYPREFIX}-rg/providers/Microsoft.Insights/components/${MYPREFIX}-insights/logs"
```
