# Containers: Containerizing an application (real-world example)

## Repository preparation

In case you don't have the source code of the application, download it:

```bash
git clone https://github.com/Erikvdv/realworldapiminimal
cd realworldapiminimal
```

Fortunately, there is already a `.dockerignore` and `Dockerfile` asset in the repo. Explore the content of those files, paying special attention to the multistage building process.

**Activity**: take note of the image versions used for building.

```bash
cat .dockerignore
cat Dockerfile
```

At the time of writing this tutorial, the `Dockerfile` is using an old version of the proposed images. Let's correct it by replacing the corresponding tags (from `6.0` to `8.0`):

```bash
sed -i s/6.0/8.0/g Dockerfile
```

## Building the image and testing the app

The process is straightforward. Let's create the image first:

```bash
docker build -t realworldapi:latest .

docker image ls realworldapi
```

Now launch a container based on it in the background, mapping the application port to `localhost`:

```bash
docker container run \
  --detach \
  --name realworld \
  -p 8080:8080 \
  realworldapi
```

See if everything started as expected:

```bash
docker logs realworld
```

Download (if required) the *Postman Collection* and the test script.


```bash
wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/Conduit.postman_collection.json
wget https://raw.githubusercontent.com/gothinkster/realworld/main/api/run-api-tests.sh
chmod +x ./run-api-tests.sh
```

Launch the tests against the mapped port:

```bash
APIURL=http://localhost:8080 ./run-api-tests.sh
```

Feel free to clean up, if desired:

```bash
docker container rm --f████ realworld
```
