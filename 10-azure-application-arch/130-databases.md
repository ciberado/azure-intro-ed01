# Azure application architecture - Databases

Azure provides several managed database options, including Azure SQL Database for SQL Server-based applications, Azure SQL Managed Instance for existing SQL Server workloads, and Azure Database for PostgreSQL, MySQL, and MariaDB for open-source databases. Azure Cosmos DB supports globally distributed, multi-model databases, while Azure Managed Instance for Apache Cassandra offers a managed service for Cassandra. For analytics, Azure Synapse Analytics serves as a data warehousing solution, and Azure Cache for Redis provides in-memory caching. These services offer varying levels of control, scalability, and compatibility to meet different application requirements.


## Azure Database for PostgreSQL Flexible Server

Offers more control and flexibility compared to the Single Server option. Flexible Server allows for greater customization of database configurations and supports **high availability** within a single availability zone or across multiple zones. It also provides cost optimization features, such as the ability to **stop and start the server**, and supports **burstable** compute tiers for workloads that don't require continuous compute capacity. Additionally, Flexible Server includes built-in connection **pooling with PgBouncer**, supports a wider range of PostgreSQL versions, and allows for co-location with application tiers to reduce latency. In contrast, Single Server has more limited configuration options and is on a retirement path, with recommendations to migrate to Flexible Server for enhanced features and capabilities

## Server creation

This script will create the server with **public connectivity**, which is obviously a bad choice for production workloads but will make access to the database more straightforward during lab time.

Let's first choose a password. As this is a lab, we will take note of it in a file.

```bash
export SQL_PASS=MyP@ssword$RANDOM
echo $SQL_PASS > sql_pass.txt
```

Now we can create the database server:

```bash
az postgres flexible-server create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app-db \
  --database-name conduit \
  --public-access 0.0.0.0 \
  --admin-user dbadmin \
  --admin-password $SQL_PASS \
  --tier Burstable \
  --sku-name Standard_B1ms 
```

It will take some time to provision. Once available, use the following command to get
details about the instance:

```bash
az postgres flexible-server l«ist» --output table  
```

## Firewall configuration

By default, the database servers have null connectivity thanks to their database and it is
necessary to open it to accept incoming connections. In our case
this step is optional, as the rule creation was already included in the server creation command.

```bash
export MY_IP=$(curl ifconfig.me)
echo Your current IP is $MY_IP.

az postgres flexible-server f«irewall-rul»e create \
  --resource-group $MYPREFIX-rg \
  --name $MYPREFIX-app-db \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP \
  --output table
```

## Checking database

If required, use `cat sql_pass.txt` to know which password was used for creating the server.
If you can't connect to the database, please check if there is any VPN/Firewall software running in your
machine (zScaler or similar) that prevents the connection from your side.

Alternatively, use the [Azure Cloud Shell](https://portal.azure.com/#cloudshell/) to connect from the
cloud itself (but remember that you need to open the CloudShell IP in the firewall using the previous
commnad).

Let's install a database client:

```bash
sudo apt install postgresql-client-common postgresql-client -y
```

So now we can connect to it:

```bash
psql \
  --host=$MYPREFIX-app-db.postgres.database.azure.com \
  --port=5432 \
  --dbname=conduit \
  --username=dbadmin \
  --set=sslmode=require
```
